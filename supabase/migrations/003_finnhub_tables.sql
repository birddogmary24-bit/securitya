-- Migration 003: Finnhub data tables
-- Adds company profiles, financials, analyst recommendations, price targets,
-- upgrades/downgrades, insider transactions, earnings calendar, and batch state tracking.

-- ============================================================
-- 1. stock_profiles — Company profile info
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_profiles (
  ticker        TEXT PRIMARY KEY,
  name          TEXT,
  name_kr       TEXT,
  sector        TEXT,
  market_cap    NUMERIC,
  logo_url      TEXT,
  website_url   TEXT,
  tier          INT CHECK (tier BETWEEN 1 AND 3),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_profiles_sector ON stock_profiles (sector);
CREATE INDEX IF NOT EXISTS idx_stock_profiles_tier ON stock_profiles (tier);

ALTER TABLE stock_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read stock_profiles" ON stock_profiles;
CREATE POLICY "Allow public read stock_profiles" ON stock_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write stock_profiles" ON stock_profiles;
CREATE POLICY "Allow service write stock_profiles" ON stock_profiles FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 2. stock_financials — Basic financial metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_financials (
  ticker         TEXT PRIMARY KEY,
  pe_ratio       NUMERIC,
  pb_ratio       NUMERIC,
  dividend_yield NUMERIC,
  week52_high    NUMERIC,
  week52_low     NUMERIC,
  market_cap     NUMERIC,
  beta           NUMERIC,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_financials_updated ON stock_financials (updated_at);

ALTER TABLE stock_financials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read stock_financials" ON stock_financials;
CREATE POLICY "Allow public read stock_financials" ON stock_financials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write stock_financials" ON stock_financials;
CREATE POLICY "Allow service write stock_financials" ON stock_financials FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. stock_recommendations — Analyst consensus ratings
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_recommendations (
  ticker      TEXT PRIMARY KEY,
  buy         INT,
  hold        INT,
  sell        INT,
  strong_buy  INT,
  strong_sell INT,
  period      TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read stock_recommendations" ON stock_recommendations;
CREATE POLICY "Allow public read stock_recommendations" ON stock_recommendations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write stock_recommendations" ON stock_recommendations;
CREATE POLICY "Allow service write stock_recommendations" ON stock_recommendations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 4. stock_price_targets — Analyst price targets
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_price_targets (
  ticker        TEXT PRIMARY KEY,
  target_high   NUMERIC,
  target_low    NUMERIC,
  target_mean   NUMERIC,
  target_median NUMERIC,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_price_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read stock_price_targets" ON stock_price_targets;
CREATE POLICY "Allow public read stock_price_targets" ON stock_price_targets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write stock_price_targets" ON stock_price_targets;
CREATE POLICY "Allow service write stock_price_targets" ON stock_price_targets FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. stock_upgrades — Upgrade / downgrade events
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_upgrades (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker          TEXT NOT NULL,
  company         TEXT,
  action          TEXT,
  from_grade      TEXT,
  to_grade        TEXT,
  graded_at       DATE,
  collected_date  DATE DEFAULT CURRENT_DATE
);

-- Unique constraint (idempotent via DO block since IF NOT EXISTS not supported)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_stock_upgrades_ticker_company_graded'
  ) THEN
    ALTER TABLE stock_upgrades
      ADD CONSTRAINT uq_stock_upgrades_ticker_company_graded
      UNIQUE (ticker, company, graded_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_upgrades_ticker ON stock_upgrades (ticker);
CREATE INDEX IF NOT EXISTS idx_stock_upgrades_graded_at ON stock_upgrades (graded_at);

ALTER TABLE stock_upgrades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read stock_upgrades" ON stock_upgrades;
CREATE POLICY "Allow public read stock_upgrades" ON stock_upgrades FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write stock_upgrades" ON stock_upgrades;
CREATE POLICY "Allow service write stock_upgrades" ON stock_upgrades FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. stock_insider_transactions — Insider trades
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_insider_transactions (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker            TEXT NOT NULL,
  person_name       TEXT,
  position          TEXT,
  transaction_type  TEXT,
  shares            NUMERIC,
  price             NUMERIC,
  filed_at          DATE,
  collected_date    DATE DEFAULT CURRENT_DATE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_insider_tx_ticker_person_filed_type'
  ) THEN
    ALTER TABLE stock_insider_transactions
      ADD CONSTRAINT uq_insider_tx_ticker_person_filed_type
      UNIQUE (ticker, person_name, filed_at, transaction_type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_insider_tx_ticker ON stock_insider_transactions (ticker);
CREATE INDEX IF NOT EXISTS idx_insider_tx_filed_at ON stock_insider_transactions (filed_at);

ALTER TABLE stock_insider_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read stock_insider_transactions" ON stock_insider_transactions;
CREATE POLICY "Allow public read stock_insider_transactions" ON stock_insider_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write stock_insider_transactions" ON stock_insider_transactions;
CREATE POLICY "Allow service write stock_insider_transactions" ON stock_insider_transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 7. earnings_calendar — Earnings schedule and results
-- ============================================================
CREATE TABLE IF NOT EXISTS earnings_calendar (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker           TEXT NOT NULL,
  report_date      DATE,
  eps_estimate     NUMERIC,
  eps_actual       NUMERIC,
  revenue_estimate BIGINT,
  revenue_actual   BIGINT,
  quarter          TEXT
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_earnings_ticker_report_date'
  ) THEN
    ALTER TABLE earnings_calendar
      ADD CONSTRAINT uq_earnings_ticker_report_date
      UNIQUE (ticker, report_date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_earnings_ticker ON earnings_calendar (ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_report_date ON earnings_calendar (report_date);

ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read earnings_calendar" ON earnings_calendar;
CREATE POLICY "Allow public read earnings_calendar" ON earnings_calendar FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write earnings_calendar" ON earnings_calendar;
CREATE POLICY "Allow service write earnings_calendar" ON earnings_calendar FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 8. batch_state — Batch progress tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_state (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_type     TEXT NOT NULL,
  batch_date     DATE NOT NULL,
  current_offset INT DEFAULT 0,
  total_count    INT,
  status         TEXT DEFAULT 'pending',
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_batch_state_type_date'
  ) THEN
    ALTER TABLE batch_state
      ADD CONSTRAINT uq_batch_state_type_date
      UNIQUE (batch_type, batch_date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_batch_state_status ON batch_state (status);
CREATE INDEX IF NOT EXISTS idx_batch_state_type ON batch_state (batch_type);

ALTER TABLE batch_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read batch_state" ON batch_state;
CREATE POLICY "Allow public read batch_state" ON batch_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write batch_state" ON batch_state;
CREATE POLICY "Allow service write batch_state" ON batch_state FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 9. ALTER existing tables — stock_quotes
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_quotes' AND column_name = 'high') THEN
    ALTER TABLE stock_quotes ADD COLUMN high NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_quotes' AND column_name = 'low') THEN
    ALTER TABLE stock_quotes ADD COLUMN low NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_quotes' AND column_name = 'open') THEN
    ALTER TABLE stock_quotes ADD COLUMN open NUMERIC;
  END IF;
END $$;

-- ============================================================
-- 10. ALTER existing tables — stock_news
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_news' AND column_name = 'image_url') THEN
    ALTER TABLE stock_news ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_news' AND column_name = 'category') THEN
    ALTER TABLE stock_news ADD COLUMN category TEXT DEFAULT 'company';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_stock_news_url_collected_date'
  ) THEN
    ALTER TABLE stock_news
      ADD CONSTRAINT uq_stock_news_url_collected_date
      UNIQUE (url, collected_date);
  END IF;
END $$;
