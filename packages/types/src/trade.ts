export type Trade = {
  id: string
  userId: string
  ticker: string
  name: string
  direction: 'buy' | 'sell'
  quantity: number
  price: number
  reason: string
  emotionTag?: 'confident' | 'anxious' | 'fomo' | 'analysis' | 'recommended'
  targetPrice?: number
  stopLoss?: number
  checklistPassed: boolean
  outcome?: 'profit' | 'loss' | 'holding'
  tradedAt: string
  createdAt: string
}

export type CreateTradeInput = Omit<Trade, 'id' | 'createdAt'>