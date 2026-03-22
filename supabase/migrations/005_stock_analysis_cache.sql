-- 005_stock_analysis_cache.sql
-- 종목별 AI 분석 사전 생성 캐시 + 시장 전체 분석 캐시

-- 종목별 AI 분석 캐시
CREATE TABLE IF NOT EXISTS stock_analysis_cache (
  ticker TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  summary TEXT NOT NULL,
  key_points JSONB NOT NULL,
  proactive_suggestion TEXT,
  related_tickers JSONB,
  data_freshness_key TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (ticker, analysis_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_analysis_date ON stock_analysis_cache (analysis_date);
CREATE INDEX IF NOT EXISTS idx_stock_analysis_generated ON stock_analysis_cache (generated_at);

ALTER TABLE stock_analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on stock_analysis_cache"
  ON stock_analysis_cache FOR ALL
  USING (true) WITH CHECK (true);

-- 시장 전체 분석 캐시 (greeting, marketOverview, macroAlert)
CREATE TABLE IF NOT EXISTS market_overview_cache (
  analysis_date DATE PRIMARY KEY,
  greeting TEXT NOT NULL,
  market_overview TEXT NOT NULL,
  macro_alert TEXT,
  data_freshness_key TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_overview_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on market_overview_cache"
  ON market_overview_cache FOR ALL
  USING (true) WITH CHECK (true);
