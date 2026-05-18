'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Indicator {
  label: string
  value: number
  raw_json: { value: number; prev_value: number; date: string; change: number }
  recorded_at: string
}

function getSignal(type: string, value: number) {
  if (type === 'yield_spread') {
    if (value < 0) return { label: 'Inverted', color: '#c94444', bg: '#fdf0f0' }
    if (value < 0.5) return { label: 'Flattening', color: '#9a6a10', bg: '#fef3e2' }
    return { label: 'Normal', color: '#2d7a4f', bg: '#e8f5ee' }
  }
  if (type === 'fed_funds') {
    if (value >= 5) return { label: 'Restrictive', color: '#c94444', bg: '#fdf0f0' }
    if (value >= 3) return { label: 'Neutral', color: '#9a6a10', bg: '#fef3e2' }
    return { label: 'Accommodative', color: '#2d7a4f', bg: '#e8f5ee' }
  }
  if (type === 'credit_spread') {
    if (value >= 6) return { label: 'Distressed', color: '#c94444', bg: '#fdf0f0' }
    if (value >= 4) return { label: 'Elevated', color: '#9a6a10', bg: '#fef3e2' }
    return { label: 'Tight', color: '#2d7a4f', bg: '#e8f5ee' }
  }
  return { label: '-', color: '#94a3b8', bg: '#f0f2f5' }
}

const descriptions: Record<string, string> = {
  yield_spread: '10Y − 2Y Treasury spread. Negative = recession warning.',
  fed_funds: 'Federal Reserve benchmark rate. Higher = tighter financial conditions.',
  credit_spread: 'HY bond spread over Treasuries. Rising = credit stress increasing.',
}

export default function MarketPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [indicators, setIndicators] = useState<Record<string, Indicator>>({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchIndicators()
  }, [token])

  const fetchIndicators = async () => {
    const res = await api.get('/market/indicators')
    setIndicators(res.data)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.post('/market/refresh')
      await fetchIndicators()
    } catch { alert('Update failed') }
    finally { setRefreshing(false) }
  }

  const indicatorKeys = ['yield_spread', 'fed_funds', 'credit_spread']

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>Market Signals</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Key macro indicators for informed trading</div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '8px',
            border: '0.5px solid #e2e8f0', background: '#fff',
            color: '#94a3b8', fontSize: '13px', cursor: 'pointer'
          }}>
          <i className={`ti ti-refresh ${refreshing ? 'animate-spin' : ''}`} style={{ fontSize: '14px' }} aria-hidden="true"></i>
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {indicatorKeys.map(key => {
          const ind = indicators[key]
          if (!ind) return (
            <div key={key} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#c0cad8' }}>No data — click Refresh to load</div>
            </div>
          )
          const signal = getSignal(key, ind.value)
          const change = ind.raw_json?.change ?? 0
          return (
            <div key={key} style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '0.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{ind.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>{ind.value}%</span>
                    <span style={{ fontSize: '13px', color: change > 0 ? '#c94444' : change < 0 ? '#2d7a4f' : '#94a3b8' }}>
                      {change > 0 ? '+' : ''}{change.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#c0cad8', marginTop: '4px' }}>As of {ind.raw_json?.date}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '4px 12px', borderRadius: '6px',
                  background: signal.bg, color: signal.color
                }}>
                  {signal.label}
                </span>
              </div>
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid #f0f2f5', fontSize: '12px', color: '#94a3b8' }}>
                {descriptions[key]}
              </div>
            </div>
          )
        })}
      </div>

      {/* 안내 박스 */}
      <div style={{ background: '#1c2333', borderRadius: '12px', padding: '18px 24px' }}>
        <div style={{ fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Trading Tip</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
          Check these signals before entering a new position. When credit spreads are rising or the yield curve is inverted, consider reducing position size and tightening stop losses.
        </div>
      </div>
    </div>
  )
}