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
  confident: '확신', anxious: '불안', fomo: 'FOMO',
  analysis: '분석기반', recommended: '추천매매', 미기록: '미기록'
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-sm">← 대시보드</button>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-gray-900">📊 매매 통계</h1>
        </div>

        {/* 핵심 지표 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '총 거래', value: `${summary.total_trades}건` },
            { label: '매수', value: `${summary.buy_count}건`, color: 'text-red-500' },
            { label: '매도', value: `${summary.sell_count}건`, color: 'text-blue-500' },
            { label: '승률', value: `${summary.win_rate}%`, color: summary.win_rate >= 50 ? 'text-green-500' : 'text-red-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color || 'text-gray-900'}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* 총 거래 금액 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <p className="text-xs text-gray-400 mb-1">총 거래 금액</p>
          <p className="text-3xl font-bold text-gray-900">{summary.total_amount.toLocaleString()}원</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 감정 태그 분포 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 mb-4">감정 태그별 거래</h2>
            {Object.entries(summary.emotion_stats).length === 0 ? (
              <p className="text-gray-300 text-sm">데이터 없음</p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(summary.emotion_stats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tag, count]) => {
                    const total = Object.values(summary.emotion_stats).reduce((a, b) => a + b, 0)
                    const pct = Math.round(count / total * 100)
                    return (
                      <div key={tag}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{emotionLabels[tag] || tag}</span>
                          <span>{count}건 ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* 종목별 거래 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 mb-4">종목별 거래 횟수</h2>
            {Object.entries(summary.ticker_stats).length === 0 ? (
              <p className="text-gray-300 text-sm">데이터 없음</p>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(summary.ticker_stats)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([ticker, count]) => (
                    <div key={ticker} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="font-bold text-gray-900 text-sm">{ticker}</span>
                      <span className="text-xs text-gray-400">{count}건</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}