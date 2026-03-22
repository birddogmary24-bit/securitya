-- 004_tier3_ondemand.sql
-- Tier 3 On-demand 종목 지원을 위한 스키마 변경

-- stock_profiles에 last_accessed_at 컬럼 추가 (TTL 갱신 판단용)
ALTER TABLE stock_profiles
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- stock_quotes에도 last_accessed_at 추가
ALTER TABLE stock_quotes
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- 기존 데이터 업데이트
UPDATE stock_profiles SET last_accessed_at = updated_at WHERE last_accessed_at IS NULL;

-- 활성 Tier 3 종목 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_profiles_tier_accessed
ON stock_profiles (tier, last_accessed_at DESC)
WHERE tier = '3';

-- TTL 만료 종목 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_quotes_updated
ON stock_quotes (updated_at);
