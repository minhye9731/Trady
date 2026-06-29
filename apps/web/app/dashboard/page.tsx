'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Trade {
  id: string
  ticker: string
  name: string
  direction: string
  quantity: number
  price: number
  reason: string
  emotion_tag: string
  checklist_passed: boolean
  outcome: string
  traded_at: string
}

interface Summary {
  total_trades: number
  buy_count: number
  sell_count: number
  win_rate: number
  emotion_stats: Record<string, number>
}

const emotionLabels: Record<string, string> = {
  confident: 'Confident', anxious: 'Anxious', fomo: 'FOMO',
  analysis: 'Analysis', recommended: 'Recommended'
}

export default function DashboardPage() {
  const { token, logout } = useAuthStore()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    ticker: '', name: '', direction: 'buy', quantity: '',
    price: '', reason: '', emotion_tag: 'analysis',
    target_price: '', stop_loss: '', checklist_passed: false,
    traded_at: new Date().toISOString().slice(0, 16),
  })

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchAll()
  }, [token])

  const fetchAll = async () => {
    const [t, s] = await Promise.all([api.get('/trades/'), api.get('/stats/summary')])
    setTrades(t.data)
    setSummary(s.data)
  }

  const handleSubmit = async () => {
    if (!form.reason) { alert('매매 이유를 입력해주세요!'); return }
    setLoading(true)
    try {
      await api.post('/trades/', {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        target_price: form.target_price ? Number(form.target_price) : null,
        stop_loss: form.stop_loss ? Number(form.stop_loss) : null,
        traded_at: new Date(form.traded_at).toISOString(),
      })
      setShowForm(false)
      setForm({ ticker: '', name: '', direction: 'buy', quantity: '', price: '',
        reason: '', emotion_tag: 'analysis', target_price: '', stop_loss: '',
        checklist_passed: false, traded_at: new Date().toISOString().slice(0, 16) })
      fetchAll()
    } catch { alert('저장 실패') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await api.delete(`/trades/${id}`)
    fetchAll()
  }

  const inp = (extra?: any) => ({
    style: {
      width: '100%', padding: '9px 12px', borderRadius: '8px',
      border: '0.5px solid #e2e8f0', fontSize: '13px',
      outline: 'none', background: '#fafafa', color: '#1c2333', ...extra
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '28px 32px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>Overview</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '8px', border: 'none',
            background: '#1c2333', color: '#e8eaf0', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer'
          }}>
          <i className="ti ti-plus" style={{ fontSize: '14px' }} aria-hidden="true"></i>
          New Trade
        </button>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Trades', value: summary.total_trades, unit: '' },
            { label: 'Buy', value: summary.buy_count, unit: '', color: '#2d7a4f' },
            { label: 'Sell', value: summary.sell_count, unit: '', color: '#c94444' },
            { label: 'Win Rate', value: summary.win_rate, unit: '%', color: summary.win_rate >= 50 ? '#2d7a4f' : '#c94444' },
          ].map(item => (
            <div key={item.label} style={{
              background: '#fff', borderRadius: '12px', padding: '18px',
              border: '0.5px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{item.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 500, color: item.color || '#1c2333' }}>{item.value}{item.unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* 매매일지 작성 폼 */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '24px',
          border: '0.5px solid #e2e8f0', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1c2333', marginBottom: '18px' }}>New Trade Entry</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>TICKER</div>
              <input placeholder="AAPL" value={form.ticker}
                onChange={e => setForm({...form, ticker: e.target.value})} {...inp()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>NAME</div>
              <input placeholder="Apple Inc." value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} {...inp()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>DIRECTION</div>
              <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} {...inp()}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>EMOTION</div>
              <select value={form.emotion_tag} onChange={e => setForm({...form, emotion_tag: e.target.value})} {...inp()}>
                <option value="analysis">Analysis</option>
                <option value="confident">Confident</option>
                <option value="anxious">Anxious</option>
                <option value="fomo">FOMO</option>
                <option value="recommended">Recommended</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>QTY</div>
              <input placeholder="10" type="number" value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})} {...inp()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>PRICE</div>
              <input placeholder="150" type="number" value={form.price}
                onChange={e => setForm({...form, price: e.target.value})} {...inp()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>TARGET</div>
              <input placeholder="Optional" type="number" value={form.target_price}
                onChange={e => setForm({...form, target_price: e.target.value})} {...inp()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>STOP LOSS</div>
              <input placeholder="Optional" type="number" value={form.stop_loss}
                onChange={e => setForm({...form, stop_loss: e.target.value})} {...inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>DATE & TIME</div>
              <input type="datetime-local" value={form.traded_at}
                onChange={e => setForm({...form, traded_at: e.target.value})} {...inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>REASON <span style={{ color: '#c94444' }}>*</span></div>
              <textarea placeholder="Why are you making this trade?" value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
                style={{ ...inp().style, height: '80px', resize: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <input type="checkbox" id="checklist" checked={form.checklist_passed}
              onChange={e => setForm({...form, checklist_passed: e.target.checked})} />
            <label htmlFor="checklist" style={{ fontSize: '12px', color: '#94a3b8' }}>Principle checklist confirmed</label>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{
                flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
                background: loading ? '#94a3b8' : '#1c2333', color: '#fff',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer'
              }}>
              {loading ? 'Saving...' : 'Save Trade'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{
                padding: '11px 20px', borderRadius: '8px',
                border: '0.5px solid #e2e8f0', background: '#fff',
                color: '#94a3b8', fontSize: '13px', cursor: 'pointer'
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 매매일지 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {trades.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px',
            background: '#fff', borderRadius: '14px', border: '0.5px solid #e2e8f0'
          }}>
            <i className="ti ti-notebook" style={{ fontSize: '32px', color: '#c0cad8', display: 'block', marginBottom: '12px' }} aria-hidden="true"></i>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>No trades yet. Start recording your first trade.</div>
          </div>
        )}
        {trades.map(trade => (
          <div key={trade.id}
            onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
            style={{
              background: '#fff', borderRadius: '12px', padding: '16px 20px',
              border: '0.5px solid #e2e8f0', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'border-color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 500, padding: '3px 9px', borderRadius: '4px',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                background: trade.direction === 'buy' ? '#e8f5ee' : '#fdf0f0',
                color: trade.direction === 'buy' ? '#2d7a4f' : '#c94444',
                border: `0.5px solid ${trade.direction === 'buy' ? '#b8dfc8' : '#f5c2c2'}`
              }}>
                {trade.direction}
              </span>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1c2333' }}>{trade.ticker}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{trade.name}</span>
              </div>
              {trade.emotion_tag && (
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                  background: '#f0f2f5', color: '#94a3b8'
                }}>
                  {emotionLabels[trade.emotion_tag] || trade.emotion_tag}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333' }}>
                  {(trade.quantity * trade.price).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {trade.quantity} × {trade.price.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#c0cad8' }}>
                {new Date(trade.traded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(trade.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#c0cad8', fontSize: '14px', padding: '4px'
                }}>
                <i className="ti ti-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}