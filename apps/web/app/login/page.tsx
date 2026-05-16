'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (isSignup) {
        await api.post('/auth/signup', form)
        alert('가입 완료! 로그인해주세요.')
        setIsSignup(false)
      } else {
        const res = await api.post('/auth/signin', {
          email: form.email,
          password: form.password,
        })
        setAuth(res.data.access_token, res.data.user_id)
        router.push('/dashboard')
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📒 Trady</h1>
        <p className="text-gray-500 text-sm mb-8">뇌동매매 없는 투자 습관</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isSignup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            로그인
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isSignup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            회원가입
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {isSignup && (
            <input
              type="text"
              placeholder="닉네임"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '처리중...' : isSignup ? '회원가입' : '로그인'}
        </button>
      </div>
    </div>
  )
}