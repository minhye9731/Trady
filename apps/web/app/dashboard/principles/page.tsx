'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Principle {
  id: string
  title: string
  content: string
  category: string
  is_active: boolean
  version: number
  updated_at: string
}

const categoryLabels: Record<string, string> = {
  entry: 'Entry', takeprofit: 'Take Profit',
  stoploss: 'Stop Loss', position: 'Position', psychology: 'Psychology'
}

const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
  entry: { bg: '#e6f1fb', text: '#185fa5', border: '#b5d4f4' },
  takeprofit: { bg: '#e8f5ee', text: '#2d7a4f', border: '#b8dfc8' },
  stoploss: { bg: '#fdf0f0', text: '#c94444', border: '#f5c2c2' },
  position: { bg: '#fef3e2', text: '#9a6a10', border: '#f5dfa0' },
  psychology: { bg: '#f3f0fe', text: '#534ab7', border: '#cec bf6' },
}

export default function PrinciplesPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'entry', is_active: true })

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchPrinciples()
  }, [token])

  const fetchPrinciples = async () => {
    const res = await api.get('/principles/')
    setPrinciples(res.data)
  }

  const resetForm = () => {
    setForm({ title: '', content: '', category: 'entry', is_active: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.title) { alert('제목을 입력해주세요!'); return }
    setLoading(true)
    try {
      if (editingId) await api.put(`/principles/${editingId}`, form)
      else await api.post('/principles/', form)
      resetForm()
      fetchPrinciples()
    } catch { alert('저장 실패') }
    finally { setLoading(false) }
  }

  const handleEdit = (p: Principle) => {
    setForm({ title: p.title, content: p.content, category: p.category, is_active: p.is_active })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await api.delete(`/principles/${id}`)
    fetchPrinciples()
  }

  const handleToggle = async (p: Principle) => {
    await api.put(`/principles/${p.id}`, { ...p, is_active: !p.is_active })
    fetchPrinciples()
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>Principles</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Your personal investment rules</div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '8px', border: 'none',
            background: '#1c2333', color: '#e8eaf0', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer'
          }}>
          <i className="ti ti-plus" style={{ fontSize: '14px' }} aria-hidden="true"></i>
          New Principle
        </button>
      </div>

      {/* 폼 */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '0.5px solid #e2e8f0', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1c2333', marginBottom: '18px' }}>
            {editingId ? 'Edit Principle' : 'New Principle'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>TITLE</div>
              <input placeholder="e.g. Never chase a breakout" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})} {...inp()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>CATEGORY</div>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} {...inp()}>
                <option value="entry">Entry</option>
                <option value="takeprofit">Take Profit</option>
                <option value="stoploss">Stop Loss</option>
                <option value="position">Position</option>
                <option value="psychology">Psychology</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>DETAIL</div>
              <textarea placeholder="Describe this principle in detail..." value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                style={{ ...inp().style, height: '80px', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm({...form, is_active: e.target.checked})} />
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Currently active</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{
                flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
                background: loading ? '#94a3b8' : '#1c2333', color: '#fff',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer'
              }}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </button>
            <button onClick={resetForm}
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

      {/* 목록 */}
      {principles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '14px', border: '0.5px solid #e2e8f0' }}>
          <i className="ti ti-notebook" style={{ fontSize: '32px', color: '#c0cad8', display: 'block', marginBottom: '12px' }} aria-hidden="true"></i>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>No principles yet. Define your first rule.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {principles.map(p => {
            const colors = categoryColors[p.category] || { bg: '#f0f2f5', text: '#94a3b8', border: '#e2e8f0' }
            return (
              <div key={p.id} style={{
                background: '#fff', borderRadius: '12px', padding: '16px 20px',
                border: '0.5px solid #e2e8f0', opacity: p.is_active ? 1 : 0.5
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 500, padding: '3px 9px', borderRadius: '4px',
                      background: colors.bg, color: colors.text, border: `0.5px solid ${colors.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                      {categoryLabels[p.category]}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1c2333' }}>{p.title}</span>
                    <span style={{ fontSize: '11px', color: '#c0cad8' }}>v{p.version}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginLeft: '12px' }}>
                    <button onClick={() => handleToggle(p)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#c0cad8' }}>
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleEdit(p)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#94a3b8' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#c0cad8' }}>
                      <i className="ti ti-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                {p.content && (
                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, paddingLeft: '2px' }}>
                    {p.content}
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#c0cad8' }}>
                  Updated {new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}