'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { token, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) router.push('/login')
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">📒 Trady</h1>
          <button
            onClick={() => { logout(); router.push('/login') }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </div>
        <p className="text-gray-600">대시보드 — 곧 매매일지가 여기 들어와요!</p>
      </div>
    </div>
  )
}