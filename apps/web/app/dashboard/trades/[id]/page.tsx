'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  target_price: number
  stop_loss: number
  checklist_passed: boolean
  outcome: string
  traded_at: string
}

const emotionLabels: Record<string, string> = {
  confident: '확신', anxious: '불안', fomo: 'FOMO',
  analysis: '분석기반', recommended: '추천매매'
}

export default function TradeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuthStore()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchTrade()
  }, [token])

  const fetchTrade = async () => {
    const res = await api.get(`/trades/${params.id}`)
    setTrade(res.data)
    setForm({
      ...res.data,
      traded_at: new Date(res.data.traded_at).toISOString().slice(0, 16),
    })
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await api.put(`/trades/${params.id}`, {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        target_price: form.target_price ? Number(form.target_price) : null,
        stop_loss: form.stop_loss ? Number(form.stop_loss) : null,
        traded_at: new Date(form.traded_at).toISOString(),
      })
      setEditing(false)
      fetchTrade()
    } catch {
      alert('수정 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('삭제할까요?')) return
    await api.delete(`/trades/${params.id}`)
    router.push('/dashboard')
  }

  if (!trade || !form) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-sm">← 목록으로</button>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-gray-900">{trade.ticker} 매매일지</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {!editing ? (
            <>
              {/* 상세 보기 */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${trade.direction === 'buy' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {trade.direction === 'buy' ? '매수' : '매도'}
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 text-lg">{trade.ticker}</span>
                    <span className="text-gray-400 text-sm ml-2">{trade.name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(true)}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">수정</button>
                  <button onClick={handleDelete}
                    className="px-3 py-1 bg-red-50 text-red-400 rounded-lg text-sm hover:bg-red-100">삭제</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">수량</p>
                  <p className="font-bold text-gray-900">{trade.quantity}주</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">가격</p>
                  <p className="font-bold text-gray-900">{trade.price.toLocaleString()}원</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">총 금액</p>
                  <p className="font-bold text-gray-900">{(trade.quantity * trade.price).toLocaleString()}원</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">감정 태그</p>
                  <p className="font-bold text-gray-900">{emotionLabels[trade.emotion_tag] || '-'}</p>
                </div>
                {trade.target_price && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-400 mb-1">목표가</p>
                    <p className="font-bold text-green-700">{trade.target_price.toLocaleString()}원</p>
                  </div>
                )}
                {trade.stop_loss && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-xs text-red-400 mb-1">손절가</p>
                    <p className="font-bold text-red-700">{trade.stop_loss.toLocaleString()}원</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">매매 이유</p>
                <p className="text-gray-700 bg-gray-50 rounded-xl p-4 text-sm leading-relaxed">{trade.reason || '-'}</p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${trade.checklist_passed ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                  <span className="text-xs text-gray-400">{trade.checklist_passed ? '체크리스트 완료' : '체크리스트 미완료'}</span>
                </div>
                <p className="text-xs text-gray-300">{new Date(trade.traded_at).toLocaleString('ko-KR')}</p>
              </div>
            </>
          ) : (
            <>
              {/* 수정 폼 */}
              <h2 className="text-lg font-bold text-gray-900 mb-4">매매일지 수정</h2>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="티커" value={form.ticker}
                  onChange={e => setForm({...form, ticker: e.target.value})}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                <input placeholder="종목명" value={form.name || ''}
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
                <input placeholder="목표가" type="number" value={form.target_price || ''}
                  onChange={e => setForm({...form, target_price: e.target.value})}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                <input placeholder="손절가" type="number" value={form.stop_loss || ''}
                  onChange={e => setForm({...form, stop_loss: e.target.value})}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                <input type="datetime-local" value={form.traded_at}
                  onChange={e => setForm({...form, traded_at: e.target.value})}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 col-span-2" />
              </div>
              <textarea placeholder="매매 이유 ⭐" value={form.reason || ''}
                onChange={e => setForm({...form, reason: e.target.value})}
                className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 h-24 resize-none" />
              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" checked={form.checklist_passed}
                  onChange={e => setForm({...form, checklist_passed: e.target.checked})}
                  className="w-4 h-4" />
                <label className="text-sm text-gray-600">체크리스트 확인 완료</label>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdate} disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? '저장중...' : '수정 완료'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}