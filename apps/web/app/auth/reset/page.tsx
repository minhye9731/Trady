'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)
  
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
        supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        }).then(() => setReady(true))
        }
    }
  }, [])

  const handleReset = async () => {
    if (password !== confirm) { setMsg('Passwords do not match'); return }
    if (password.length < 6) { setMsg('Password must be at least 6 characters'); return }
    setLoading(true)
    setMsg('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMsg('Password updated! Redirecting...')
      setTimeout(() => router.push('/login'), 2000)
    } catch (e: any) {
      setMsg(e.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const inp = (extra?: any) => ({
    style: {
      width: '100%', padding: '10px 14px', borderRadius: '8px',
      border: '0.5px solid #e2e8f0', fontSize: '14px',
      outline: 'none', background: '#fafafa', color: '#1c2333', ...extra
    }
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f2f5', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e2e8f0', padding: '40px', width: '380px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1c2333', letterSpacing: '0.06em', marginBottom: '8px' }}>TRADY</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#1c2333', marginBottom: '4px' }}>Set new password</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Enter your new password below</div>
        </div>

        {!ready ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Verifying reset link...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>NEW PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  {...inp({ paddingRight: '40px' })} />
                <button onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>
                  <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>CONFIRM PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  {...inp({ paddingRight: '40px' })} />
                <button onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>
                  <i className={`ti ${showConfirm ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {msg && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '12px',
                background: msg.includes('updated') ? '#e8f5ee' : '#fdf0f0',
                color: msg.includes('updated') ? '#2d7a4f' : '#c94444',
                border: `0.5px solid ${msg.includes('updated') ? '#b8dfc8' : '#f5c2c2'}`
              }}>
                {msg}
              </div>
            )}

            <button onClick={handleReset} disabled={loading}
              style={{
                width: '100%', marginTop: '6px', padding: '12px', borderRadius: '8px',
                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                background: loading ? '#94a3b8' : '#1c2333', color: '#fff'
              }}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}