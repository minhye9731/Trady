-- Phase 1: Position-based Trade Accounting System
-- Created: 2026-11-10
-- Description: Add positions table and migrate trades schema

-- 1. Create positions table
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

-- Create indexes on positions
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_user_ticker_currency ON positions(user_id, ticker, currency);
CREATE UNIQUE INDEX idx_positions_open_unique
  ON positions(user_id, ticker, currency)
  WHERE status = 'open';

-- 2. Modify trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS fee NUMERIC(20, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS sell_decision TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_profit NUMERIC(20, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_return_pct NUMERIC(10, 4);

-- Modify existing columns
ALTER TABLE trades ALTER COLUMN traded_at SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE trades ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ;

-- Change ticker to TEXT (if not already)
ALTER TABLE trades ALTER COLUMN ticker SET DATA TYPE TEXT;

-- Create indexes on trades
CREATE INDEX IF NOT EXISTS idx_trades_user_ticker_traded_at
  ON trades(user_id, ticker, currency, traded_at, created_at);

-- 3. Enable RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for positions
DROP POLICY IF EXISTS positions_user_isolation ON positions;
CREATE POLICY positions_user_isolation ON positions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Clear existing test data
DELETE FROM trades WHERE 1=1;
DELETE FROM positions WHERE 1=1;
