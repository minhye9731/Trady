'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Summary {
  total_trades: number
  buy_count: number
  sell_count: number
  total_amount: number
  win_rate: number
  emotion_stats: Record<string, number>
  ticker_stats: Record<string, number>
}

const emotionLabels: Record<string, string> = {
  confident: 'Confident', anxious: 'Anxious', fomo: 'FOMO',
  analysis: 'Analysis', recommended: 'Recommended', 미기록: 'Untagged'
}

export default function StatsPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    api.get('/stats/summary').then(res => setSummary(res.data))
  }, [token])

  if (!summary) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '28px 32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>Statistics</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Your trading performance overview</div>
      </div>

      {/* 핵심 지표 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Trades', value: summary.total_trades, unit: '' },
          { label: 'Buy', value: summary.buy_count, unit: '', color: '#2d7a4f' },
          { label: 'Sell', value: summary.sell_count, unit: '', color: '#c94444' },
          { label: 'Win Rate', value: summary.win_rate, unit: '%', color: summary.win_rate >= 50 ? '#2d7a4f' : '#c94444' },
        ].map(item => (
          <div key={item.label} style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '0.5px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{item.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 500, color: item.color || '#1c2333' }}>{item.value}{item.unit}</div>
          </div>
        ))}
      </div>

      {/* 총 거래 금액 */}
      <div style={{ background: '#1c2333', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Volume</div>
        <div style={{ fontSize: '32px', fontWeight: 500, color: '#e8eaf0', letterSpacing: '-0.02em' }}>
          {summary.total_amount.toLocaleString()}<span style={{ fontSize: '16px', color: '#4a5568', marginLeft: '6px' }}>KRW</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 감정 태그 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333', marginBottom: '16px' }}>Emotion Breakdown</div>
          {Object.entries(summary.emotion_stats).length === 0 ? (
            <div style={{ fontSize: '13px', color: '#c0cad8' }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(summary.emotion_stats).sort((a, b) => b[1] - a[1]).map(([tag, count]) => {
                const total = Object.values(summary.emotion_stats).reduce((a, b) => a + b, 0)
                const pct = Math.round(count / total * 100)
                const isFomo = tag === 'fomo'
                return (
                  <div key={tag}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: isFomo ? '#c94444' : '#94a3b8' }}>{emotionLabels[tag] || tag}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{count} · {pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#f0f2f5', borderRadius: '99px' }}>
                      <div style={{ height: '4px', borderRadius: '99px', width: `${pct}%`, background: isFomo ? '#c94444' : '#1c2333' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 종목별 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333', marginBottom: '16px' }}>Top Tickers</div>
          {Object.entries(summary.ticker_stats).length === 0 ? (
            <div style={{ fontSize: '13px', color: '#c0cad8' }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Object.entries(summary.ticker_stats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([ticker, count], i) => (
                <div key={ticker} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '0.5px solid #f0f2f5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#c0cad8', width: '16px' }}>{i + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333' }}>{ticker}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{count} trades</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}