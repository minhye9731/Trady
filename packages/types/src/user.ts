export type User = {
  id: string
  nickname: string
  investStyle: ('longterm' | 'shortterm' | 'swing')[]
  plan: 'free' | 'pro' | 'premium'
  createdAt: string
}