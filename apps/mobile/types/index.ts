// Shapes returned by the FastAPI backend (snake_case, matching Supabase columns).

export type TradeDirection = 'buy' | 'sell';
export type EmotionTag = 'confident' | 'anxious' | 'fomo' | 'analysis' | 'recommended';
export type TradeOutcome = 'holding' | 'profit' | 'loss';
export type PrincipleCategory = 'entry' | 'takeprofit' | 'stoploss' | 'position' | 'psychology';
export type ReportType = 'weekly' | 'monthly';
export type IndicatorType = 'yield_spread' | 'fed_funds' | 'credit_spread';

export interface Trade {
  id: string;
  ticker: string;
  name: string | null;
  direction: TradeDirection;
  quantity: number;
  price: number;
  currency: string;
  fee: number | null;
  reason: string | null;
  emotion_tag: EmotionTag | null;
  target_price: number | null;
  stop_loss: number | null;
  checklist_passed: boolean;
  outcome: TradeOutcome | null;
  realized_profit: number | null;
  realized_return_pct: number | null;
  traded_at: string;
}

export interface TradeInput {
  ticker: string;
  name: string | null;
  direction: TradeDirection;
  quantity: number;
  price: number;
  currency: string;
  fee: number | null;
  reason: string | null;
  emotion_tag: EmotionTag | null;
  target_price: number | null;
  stop_loss: number | null;
  checklist_passed: boolean;
  outcome: TradeOutcome | null;
  traded_at: string;
}

export interface Summary {
  total_trades: number;
  buy_count: number;
  sell_count: number;
  total_amount: number;
  win_rate: number;
  emotion_stats: Record<string, number>;
  ticker_stats: Record<string, number>;
}

export interface Principle {
  id: string;
  title: string;
  content: string | null;
  category: PrincipleCategory | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface PrincipleInput {
  title: string;
  content: string | null;
  category: PrincipleCategory;
  is_active: boolean;
}

export interface Report {
  id: string;
  type: ReportType;
  content: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface Indicator {
  indicator_type: IndicatorType;
  label: string;
  value: number;
  raw_json: { value: number; prev_value: number; date: string; change: number };
  recorded_at: string;
}

export interface Me {
  id: string;
  email: string;
  nickname: string;
  plan: string;
}

export type MarketIndicator = Indicator;

export type SignalType = 'buy' | 'sell' | 'hold' | 'strong_buy' | 'strong_sell';

export interface TradeFormData {
  ticker: string;
  name: string | null;
  direction: TradeDirection;
  quantity: number;
  price: number;
  currency: string;
  fee: number | null;
  reason: string | null;
  emotion_tag: EmotionTag | null;
  target_price: number | null;
  stop_loss: number | null;
  checklist_passed: boolean;
  outcome: TradeOutcome | null;
  traded_at: string;
}
