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
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#f0f2f5'
    }}>
      {/* 왼쪽 패널 */}
      <div style={{
        width: '420px', background: '#1c2333',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 40px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#e8eaf0', letterSpacing: '0.08em' }}>TRADY</div>
          <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '4px' }}>Trade Journal</div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#fff', lineHeight: 1.3, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Record every trade.<br />Build better habits.
          </div>
          <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.7 }}>
            매매일지를 기록하고, 투자 원칙을 세우고,<br />
            AI 피드백으로 습관을 개선하세요.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['매매일지 작성 & 관리', 'AI 주간/월간 피드백 리포트', '투자 원칙 & 습관 추적', '실시간 마켓 시그널'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="ti ti-check" style={{ fontSize: '14px', color: '#2d7a4f' }} aria-hidden="true"></i>
              <span style={{ fontSize: '12px', color: '#4a5568' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 패널 */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '0.5px solid #e2e8f0', padding: '40px',
          width: '380px'
        }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#1c2333', marginBottom: '4px' }}>
              {isSignup ? 'Create account' : 'Welcome back'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              {isSignup ? '트레이더 계정을 만들어보세요' : '계속하려면 로그인하세요'}
            </div>
          </div>

          {/* 탭 */}
          <div style={{
            display: 'flex', background: '#f0f2f5',
            borderRadius: '8px', padding: '3px', marginBottom: '24px'
          }}>
            {['Sign in', 'Sign up'].map((label, i) => (
              <button key={label} onClick={() => setIsSignup(i === 1)}
                style={{
                  flex: 1, padding: '7px', borderRadius: '6px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                  transition: 'all 0.15s',
                  background: isSignup === (i === 1) ? '#fff' : 'transparent',
                  color: isSignup === (i === 1) ? '#1c2333' : '#94a3b8',
                  boxShadow: isSignup === (i === 1) ? '0 0 0 0.5px #e2e8f0' : 'none'
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isSignup && (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Nickname</label>
                <input type="text" placeholder="트레이더 닉네임" value={form.nickname}
                  onChange={e => setForm({ ...form, nickname: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '0.5px solid #e2e8f0', fontSize: '14px',
                    outline: 'none', background: '#fafafa'
                  }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '0.5px solid #e2e8f0', fontSize: '14px',
                  outline: 'none', background: '#fafafa'
                }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '0.5px solid #e2e8f0', fontSize: '14px',
                  outline: 'none', background: '#fafafa'
                }} />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
              background: '#fdf0f0', border: '0.5px solid #f5c2c2',
              fontSize: '12px', color: '#c94444'
            }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', marginTop: '20px', padding: '12px',
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 500,
              background: loading ? '#94a3b8' : '#1c2333',
              color: '#fff', transition: 'all 0.15s'
            }}>
            {loading ? 'Loading...' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}