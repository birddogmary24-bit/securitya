-- SEC EDGAR 공시 데이터 테이블
-- Supabase SQL Editor에서 실행

CREATE TABLE sec_filings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  cik TEXT NOT NULL,
  filing_type TEXT NOT NULL,
  filed_date DATE NOT NULL,
  title TEXT NOT NULL,
  accession_number TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sec_filings_ticker ON sec_filings(ticker);
CREATE INDEX idx_sec_filings_filed_date ON sec_filings(filed_date DESC);
