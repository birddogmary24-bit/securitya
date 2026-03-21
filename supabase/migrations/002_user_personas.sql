-- 투자자 페르소나 테이블
CREATE TABLE IF NOT EXISTS user_personas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL UNIQUE,
  swing       int NOT NULL DEFAULT 3 CHECK (swing BETWEEN 1 AND 5),
  long_term   int NOT NULL DEFAULT 3 CHECK (long_term BETWEEN 1 AND 5),
  scalping    int NOT NULL DEFAULT 3 CHECK (scalping BETWEEN 1 AND 5),
  blue_chip   int NOT NULL DEFAULT 3 CHECK (blue_chip BETWEEN 1 AND 5),
  etf         int NOT NULL DEFAULT 3 CHECK (etf BETWEEN 1 AND 5),
  small_cap   int NOT NULL DEFAULT 3 CHECK (small_cap BETWEEN 1 AND 5),
  tech        int NOT NULL DEFAULT 3 CHECK (tech BETWEEN 1 AND 5),
  dividend    int NOT NULL DEFAULT 3 CHECK (dividend BETWEEN 1 AND 5),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- RLS (Row Level Security) - 서비스 롤 키 사용이므로 비활성화
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON user_personas FOR ALL USING (true);
