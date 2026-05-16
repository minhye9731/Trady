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

export default function DashboardPage() {
  const { token, logout } = useAuthStore()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    ticker: '',
    name: '',
    direction: 'buy',
    quantity: '',
    price: '',
    reason: '',
    emotion_tag: 'analysis',
    target_price: '',
    stop_loss: '',
    checklist_passed: false,
    traded_at: new Date().toISOString().slice(0, 16),
  })

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchTrades()
  }, [token])

  const fetchTrades = async () => {
    const res = await api.get('/trades/')
    setTrades(res.data)
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
      setForm({
        ticker: '', name: '', direction: 'buy', quantity: '', price: '',
        reason: '', emotion_tag: 'analysis', target_price: '', stop_loss: '',
        checklist_passed: false, traded_at: new Date().toISOString().slice(0, 16),
      })
      fetchTrades()
    } catch (e) {
      alert('저장 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await api.delete(`/trades/${id}`)
    fetchTrades()
  }

  const emotionLabels: Record<string, string> = {
    confident: '확신', anxious: '불안', fomo: 'FOMO',
    analysis: '분석기반', recommended: '추천매매'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">📒 Trady</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + 매매일지 작성
            </button>
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 매매일지 작성 폼 */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">새 매매일지</h2>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="티커 (예: AAPL)" value={form.ticker}
                onChange={e => setForm({...form, ticker: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <input placeholder="종목명 (예: 애플)" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400">
                <option value="buy">매수</option>
                <option value="sell">매도</option>
              </select>
              <select value={form.emotion_tag} onChange={e => setForm({...form, emotion_tag: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400">
                <option value="analysis">분석기반</option>
                <option value="confident">확신</option>
                <option value="anxious">불안</option>
                <option value="fomo">FOMO</option>
                <option value="recommended">추천매매</option>
              </select>
              <input placeholder="수량" type="number" value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <input placeholder="가격" type="number" value={form.price}
                onChange={e => setForm({...form, price: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <input placeholder="목표가 (선택)" type="number" value={form.target_price}
                onChange={e => setForm({...form, target_price: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <input placeholder="손절가 (선택)" type="number" value={form.stop_loss}
                onChange={e => setForm({...form, stop_loss: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <input type="datetime-local" value={form.traded_at}
                onChange={e => setForm({...form, traded_at: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 col-span-2" />
            </div>
            <textarea placeholder="매매 이유를 적어주세요 (필수) ⭐" value={form.reason}
              onChange={e => setForm({...form, reason: e.target.value})}
              className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 h-24 resize-none" />
            <div className="flex items-center gap-2 mt-3">
              <input type="checkbox" id="checklist" checked={form.checklist_passed}
                onChange={e => setForm({...form, checklist_passed: e.target.checked})}
                className="w-4 h-4" />
              <label htmlFor="checklist" className="text-sm text-gray-600">투자 원칙 체크리스트 확인 완료</label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? '저장중...' : '저장'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                취소
              </button>
            </div>
          </div>
        )}

        {/* 매매일지 목록 */}
        <div className="flex flex-col gap-3">
          {trades.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm">아직 매매일지가 없어요. 첫 기록을 남겨보세요!</p>
            </div>
          )}
          {trades.map(trade => (
            <div key={trade.id} onClick={() => router.push(`/dashboard/trades/${trade.id}`)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${trade.direction === 'buy' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {trade.direction === 'buy' ? '매수' : '매도'}
                  </span>
                  <span className="font-bold text-gray-900">{trade.ticker}</span>
                  <span className="text-gray-500 text-sm">{trade.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {trade.emotion_tag && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                      {emotionLabels[trade.emotion_tag] || trade.emotion_tag}
                    </span>
                  )}
                  <button onClick={() => handleDelete(trade.id)}
                    className="text-xs text-gray-300 hover:text-red-400">삭제</button>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-gray-600">
                <span>{trade.quantity}주 × {trade.price.toLocaleString()}원</span>
                <span className="text-gray-400">총 {(trade.quantity * trade.price).toLocaleString()}원</span>
              </div>
              {trade.reason && (
                <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{trade.reason}</p>
              )}
              <p className="mt-2 text-xs text-gray-300">{new Date(trade.traded_at).toLocaleString('ko-KR')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}