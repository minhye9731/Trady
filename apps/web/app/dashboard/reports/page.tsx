'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Report {
  id: string
  type: string
  content: string
  period_start: string
  period_end: string
  created_at: string
}

export default function ReportsPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Report | null>(null)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchReports()
  }, [token])

  const fetchReports = async () => {
    const res = await api.get('/reports/')
    setReports(res.data)
    if (res.data.length > 0) setSelected(res.data[0])
  }

  const handleGenerate = async (type: 'weekly' | 'monthly') => {
    setLoading(true)
    try {
      await api.post('/reports/generate', { type })
      await fetchReports()
    } catch { alert('Failed to generate report') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>AI Reports</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Personalized feedback on your trading habits</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleGenerate('weekly')} disabled={loading}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              background: '#1c2333', color: '#e8eaf0', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1
            }}>
            {loading ? 'Generating...' : 'Weekly Report'}
          </button>
          <button onClick={() => handleGenerate('monthly')} disabled={loading}
            style={{
              padding: '10px 18px', borderRadius: '8px',
              border: '0.5px solid #e2e8f0', background: '#fff',
              color: '#1c2333', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', opacity: loading ? 0.6 : 1
            }}>
            Monthly Report
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: '#fff', borderRadius: '14px', border: '0.5px solid #e2e8f0' }}>
          <i className="ti ti-sparkles" style={{ fontSize: '32px', color: '#c0cad8', display: 'block', marginBottom: '12px' }} aria-hidden="true"></i>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>No reports yet</div>
          <div style={{ fontSize: '12px', color: '#c0cad8' }}>Add some trades and generate your first report</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reports.map(r => (
              <div key={r.id} onClick={() => setSelected(r)}
                style={{
                  padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: selected?.id === r.id ? '#94a3b8' : '#e2e8f0',
                  background: selected?.id === r.id ? '#fff' : '#fafafa',
                  transition: 'all 0.15s'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                    background: r.type === 'weekly' ? '#1c2333' : '#f0f2f5',
                    color: r.type === 'weekly' ? '#e8eaf0' : '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>
                    {r.type}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', border: '0.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '0.5px solid #f0f2f5' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px',
                  background: '#1c2333', color: '#e8eaf0',
                  textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  {selected.type}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(selected.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(selected.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#1c2333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {selected.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}