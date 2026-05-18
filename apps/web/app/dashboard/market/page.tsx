'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Indicator {
  indicator_type: string
  label: string
  value: number
  raw_json: {
    value: number
    prev_value: number
    date: string
    change: number
  }
  recorded_at: string
}

interface Indicators {
  yield_spread?: Indicator
  fed_funds?: Indicator
  credit_spread?: Indicator
}

function getSignal(type: string, value: number) {
  if (type === 'yield_spread') {
    if (value < 0) return { color: 'text-red-500', bg: 'bg-red-50', label: '⚠️ 역전 — 침체 경고', desc: '장기금리 < 단기금리. 역사적으로 경기침체 선행 신호.' }
    if (value < 0.5) return { color: 'text-yellow-500', bg: 'bg-yellow-50', label: '🟡 주의 — 평탄화', desc: '금리차가 좁아지는 중. 경기 둔화 가능성.' }
    return { color: 'text-green-500', bg: 'bg-green-50', label: '✅ 정상 — 경기 낙관', desc: '장기금리 > 단기금리. 정상적인 경기 상태.' }
  }
  if (type === 'fed_funds') {
    if (value >= 5) return { color: 'text-red-500', bg: 'bg-red-50', label: '🔴 고금리 — 긴축', desc: '높은 금리. 성장주/기술주에 불리.' }
    if (value >= 3) return { color: 'text-yellow-500', bg: 'bg-yellow-50', label: '🟡 중립 — 관망', desc: '중립 금리 구간. 방향성 주시 필요.' }
    return { color: 'text-green-500', bg: 'bg-green-50', label: '✅ 저금리 — 완화', desc: '낮은 금리. 위험자산 선호 환경.' }
  }
  if (type === 'credit_spread') {
    if (value >= 6) return { color: 'text-red-500', bg: 'bg-red-50', label: '🔴 위험 — 신용경색', desc: '스프레드 급등. 시장 공포, 신규 매수 자제.' }
    if (value >= 4) return { color: 'text-yellow-500', bg: 'bg-yellow-50', label: '🟡 주의 — 경계', desc: '스프레드 확대 중. 리스크 관리 강화.' }
    return { color: 'text-green-500', bg: 'bg-green-50', label: '✅ 안정 — 리스크 선호', desc: '스프레드 낮음. 시장 낙관.' }
  }
  return { color: 'text-gray-500', bg: 'bg-gray-50', label: '-', desc: '' }
}

export default function MarketPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [indicators, setIndicators] = useState<Indicators>({})
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchIndicators()
  }, [token])

  const fetchIndicators = async () => {
    const res = await api.get('/market/indicators')
    setIndicators(res.data)
    const dates = Object.values(res.data as Indicators).map(i => i?.recorded_at).filter(Boolean)
    if (dates.length > 0) setLastUpdated(dates[0] as string)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.post('/market/refresh')
      await fetchIndicators()
    } catch {
      alert('업데이트 실패')
    } finally {
      setRefreshing(false)
    }
  }

  const indicatorList = [
    { key: 'yield_spread', unit: '%' },
    { key: 'fed_funds', unit: '%' },
    { key: 'credit_spread', unit: '%' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-gray-900">🌍 마켓 대시보드</h1>
          <button onClick={handleRefresh} disabled={refreshing}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50">
            {refreshing ? '업데이트 중...' : '🔄 새로고침'}
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400 mb-8">
            마지막 업데이트: {new Date(lastUpdated).toLocaleString('ko-KR')}
          </p>
        )}

        {/* 지표 카드 */}
        <div className="flex flex-col gap-4">
          {indicatorList.map(({ key, unit }) => {
            const ind = indicators[key as keyof Indicators]
            if (!ind) return (
              <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-300 text-sm">데이터 없음 — 새로고침을 눌러주세요</p>
              </div>
            )
            const signal = getSignal(key, ind.value)
            const change = ind.raw_json?.change ?? 0
            return (
              <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{ind.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">{ind.value}{unit}</span>
                      <span className={`text-sm font-medium ${change > 0 ? 'text-red-400' : change < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">기준일: {ind.raw_json?.date}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${signal.bg} ${signal.color}`}>
                    {signal.label}
                  </span>
                </div>
                <div className={`rounded-xl px-4 py-3 ${signal.bg}`}>
                  <p className={`text-sm ${signal.color}`}>{signal.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-blue-50 rounded-2xl p-4">
          <p className="text-xs text-blue-500 font-medium mb-1">📌 활용 팁</p>
          <p className="text-xs text-blue-400 leading-relaxed">
            매매일지 작성 전 이 지표들을 확인하세요. 크레딧 스프레드 급등 또는 장단기 금리차 역전 시에는 신규 매수를 자제하고 포지션을 점검하는 것이 좋습니다.
          </p>
        </div>
      </div>
    </div>
  )
}