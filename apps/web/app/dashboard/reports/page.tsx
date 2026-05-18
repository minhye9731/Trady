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
      const res = await api.post('/reports/generate', { type })
      await fetchReports()
      setSelected({ ...res.data, type, created_at: new Date().toISOString() })
    } catch {
      alert('리포트 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">🤖 AI 피드백 리포트</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleGenerate('weekly')} disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? '생성중...' : '주간 리포트'}
            </button>
            <button onClick={() => handleGenerate('monthly')} disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {loading ? '생성중...' : '월간 리포트'}
            </button>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-sm mb-2">아직 리포트가 없어요.</p>
            <p className="text-sm">매매일지를 작성한 후 리포트를 생성해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 리포트 목록 */}
            <div className="flex flex-col gap-2">
              {reports.map(r => (
                <div key={r.id} onClick={() => setSelected(r)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${selected?.id === r.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${r.type === 'weekly' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {r.type === 'weekly' ? '주간' : '월간'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>

            {/* 리포트 내용 */}
            {selected && (
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${selected.type === 'weekly' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {selected.type === 'weekly' ? '주간 리포트' : '월간 리포트'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(selected.period_start).toLocaleDateString('ko-KR')} ~ {new Date(selected.period_end).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {selected.content}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}