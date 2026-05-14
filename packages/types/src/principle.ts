export type Principle = {
  id: string
  userId: string
  title: string
  content: string
  category: 'entry' | 'takeprofit' | 'stoploss' | 'position' | 'psychology'
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}