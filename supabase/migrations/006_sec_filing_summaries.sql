-- SEC 공시 AI 요약 캐시 테이블
CREATE TABLE IF NOT EXISTS sec_filing_summaries (
  accession_number TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  filing_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_filing_summaries_ticker ON sec_filing_summaries(ticker);
CREATE INDEX IF NOT EXISTS idx_sec_filing_summaries_created ON sec_filing_summaries(created_at);
