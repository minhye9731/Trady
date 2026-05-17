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
  created_at: string
  updated_at: string
}

const categoryLabels: Record<string, string> = {
  entry: '진입 조건',
  takeprofit: '익절 기준',
  stoploss: '손절 기준',
  position: '포지션 관리',
  psychology: '심리 관리',
}

const categoryColors: Record<string, string> = {
  entry: 'bg-blue-50 text-blue-600',
  takeprofit: 'bg-green-50 text-green-600',
  stoploss: 'bg-red-50 text-red-600',
  position: 'bg-orange-50 text-orange-600',
  psychology: 'bg-purple-50 text-purple-600',
}

export default function PrinciplesPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', content: '', category: 'entry', is_active: true
  })

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
      if (editingId) {
        await api.put(`/principles/${editingId}`, form)
      } else {
        await api.post('/principles/', form)
      }
      resetForm()
      fetchPrinciples()
    } catch {
      alert('저장 실패')
    } finally {
      setLoading(false)
    }
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

  const handleToggleActive = async (p: Principle) => {
    await api.put(`/principles/${p.id}`, { ...p, is_active: !p.is_active })
    fetchPrinciples()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-gray-600 text-sm">← 대시보드</button>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">📋 나의 투자 원칙</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + 원칙 추가
          </button>
        </div>

        {/* 작성/수정 폼 */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? '원칙 수정' : '새 투자 원칙'}
            </h2>
            <div className="flex flex-col gap-3">
              <input placeholder="원칙 제목" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400">
                <option value="entry">진입 조건</option>
                <option value="takeprofit">익절 기준</option>
                <option value="stoploss">손절 기준</option>
                <option value="position">포지션 관리</option>
                <option value="psychology">심리 관리</option>
              </select>
              <textarea placeholder="원칙 내용을 자세히 적어주세요" value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 h-28 resize-none" />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-4 h-4" />
                <label htmlFor="is_active" className="text-sm text-gray-600">현재 적용 중인 원칙</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? '저장중...' : editingId ? '수정 완료' : '저장'}
              </button>
              <button onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                취소
              </button>
            </div>
          </div>
        )}

        {/* 카테고리별 원칙 목록 */}
        {principles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">아직 투자 원칙이 없어요. 첫 원칙을 세워보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {principles.map(p => (
              <div key={p.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${p.is_active ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${categoryColors[p.category] || 'bg-gray-100 text-gray-500'}`}>
                      {categoryLabels[p.category] || p.category}
                    </span>
                    <span className="font-bold text-gray-900">{p.title}</span>
                    <span className="text-xs text-gray-300">v{p.version}</span>
                    {!p.is_active && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-400 rounded-md">비활성</span>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button onClick={() => handleToggleActive(p)}
                      className="text-xs text-gray-300 hover:text-blue-400">
                      {p.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button onClick={() => handleEdit(p)}
                      className="text-xs text-gray-300 hover:text-gray-600">수정</button>
                    <button onClick={() => handleDelete(p.id)}
                      className="text-xs text-gray-300 hover:text-red-400">삭제</button>
                  </div>
                </div>
                {p.content && (
                  <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                    {p.content}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-300">
                  마지막 수정: {new Date(p.updated_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}