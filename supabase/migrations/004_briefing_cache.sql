-- 004_briefing_cache.sql
-- 브리핑 캐시 테이블: AI 브리핑 결과를 저장하여 동일 데이터 기간 내 재호출 방지

CREATE TABLE IF NOT EXISTS briefing_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,          -- 포트폴리오+페르소나 해시
  briefing_data JSONB NOT NULL,            -- DailyBriefing 전체 JSON
  data_freshness_key TEXT NOT NULL,        -- 데이터 갱신 시점 해시 (무효화 판단용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 캐시 키로 빠른 조회
CREATE INDEX IF NOT EXISTS idx_briefing_cache_key ON briefing_cache (cache_key);

-- 만료된 캐시 자동 정리용 인덱스
CREATE INDEX IF NOT EXISTS idx_briefing_cache_expires ON briefing_cache (expires_at);

-- RLS 설정
ALTER TABLE briefing_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on briefing_cache"
  ON briefing_cache FOR ALL
  USING (true) WITH CHECK (true);
