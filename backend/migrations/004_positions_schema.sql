BEGIN;

-- 0. 테스트 데이터 삭제
DELETE FROM trades;
DELETE FROM positions;

-- 1. positions 테이블 (이미 있으면 건너뜀)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_quantity NUMERIC(20, 8) NOT NULL,
  average_price NUMERIC(20, 8) NOT NULL,
  total_cost NUMERIC(20, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이미 있는 테이블에도 체크 추가
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_status_check;
ALTER TABLE positions ADD CONSTRAINT positions_status_check
  CHECK (status IN ('open', 'closed'));
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_quantity_check;
ALTER TABLE positions ADD CONSTRAINT positions_quantity_check
  CHECK (total_quantity >= 0);

-- 인덱스 정리
DROP INDEX IF EXISTS idx_positions_user_id;
CREATE INDEX IF NOT EXISTS idx_positions_user_ticker_currency
  ON positions(user_id, ticker, currency);
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_open_unique
  ON positions(user_id, ticker, currency)
  WHERE status = 'open';

-- 2. trades 컬럼
ALTER TABLE trades ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS fee NUMERIC(20, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS sell_decision TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_profit NUMERIC(20, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_return_pct NUMERIC(10, 4);

ALTER TABLE trades ALTER COLUMN currency SET NOT NULL;
ALTER TABLE trades ALTER COLUMN traded_at TYPE TIMESTAMPTZ;
ALTER TABLE trades ALTER COLUMN created_at TYPE TIMESTAMPTZ;
ALTER TABLE trades ALTER COLUMN ticker TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_trades_user_ticker_traded_at
  ON trades(user_id, ticker, currency, traded_at, created_at);

-- 3. RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS positions_user_isolation ON positions;
CREATE POLICY positions_user_isolation ON positions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
