'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface Me {
  id: string
  email: string
  nickname: string
  plan: string
}

export default function SettingsPage() {
  const { token, logout } = useAuthStore()
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [nickname, setNickname] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nicknameLoading, setNicknameLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [nicknameMsg, setNicknameMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    api.get('/auth/me').then(res => {
      setMe(res.data)
      setNickname(res.data.nickname)
    })
  }, [token])

  const handleNickname = async () => {
    setNicknameLoading(true)
    setNicknameMsg('')
    try {
      await api.put('/auth/me', { nickname })
      setNicknameMsg('Nickname updated!')
    } catch {
      setNicknameMsg('Failed to update')
    } finally {
      setNicknameLoading(false)
    }
  }

  const handlePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters')
      return
    }
    setPasswordLoading(true)
    setPasswordMsg('')
    try {
      await api.post('/auth/change-password', { new_password: newPassword })
      setPasswordMsg('Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordMsg('Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const inp = (extra?: any) => ({
    style: {
      width: '100%', padding: '9px 12px', borderRadius: '8px',
      border: '0.5px solid #e2e8f0', fontSize: '13px',
      outline: 'none', background: '#fafafa', color: '#1c2333', ...extra
    }
  })

  if (!me) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '28px 32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '20px', fontWeight: 500, color: '#1c2333', letterSpacing: '-0.02em' }}>Settings</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Manage your account</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>

        {/* 계정 정보 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333', marginBottom: '16px' }}>Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>EMAIL</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', padding: '9px 12px', background: '#f0f2f5', borderRadius: '8px' }}>
                {me.email}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>PLAN</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px',
                  background: me.plan === 'free' ? '#f0f2f5' : '#1c2333',
                  color: me.plan === 'free' ? '#94a3b8' : '#e8eaf0',
                  textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  {me.plan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 닉네임 변경 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333', marginBottom: '16px' }}>Display Name</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="Nickname" {...inp({ flex: 1 })} />
            <button onClick={handleNickname} disabled={nicknameLoading}
              style={{
                padding: '9px 18px', borderRadius: '8px', border: 'none',
                background: '#1c2333', color: '#e8eaf0', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                opacity: nicknameLoading ? 0.6 : 1
              }}>
              {nicknameLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
          {nicknameMsg && (
            <div style={{ fontSize: '12px', marginTop: '8px', color: nicknameMsg.includes('!') ? '#2d7a4f' : '#c94444' }}>
              {nicknameMsg}
            </div>
          )}
        </div>

        {/* 비밀번호 변경 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333', marginBottom: '16px' }}>Change Password</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>NEW PASSWORD</div>
                <div style={{ position: 'relative' }}>
                    <input type={showNewPw ? 'text' : 'password'} placeholder="••••••••" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} {...inp({ paddingRight: '40px' })} />
                    <button onClick={() => setShowNewPw(!showNewPw)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>
                    <i className={`ti ${showNewPw ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>CONFIRM PASSWORD</div>
                <div style={{ position: 'relative' }}>
                    <input type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} {...inp({ paddingRight: '40px' })} />
                    <button onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>
                    <i className={`ti ${showConfirmPw ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            {passwordMsg && (
              <div style={{ fontSize: '12px', color: passwordMsg.includes('successfully') ? '#2d7a4f' : '#c94444' }}>
                {passwordMsg}
              </div>
            )}
            <button onClick={handlePassword} disabled={passwordLoading}
              style={{
                padding: '11px', borderRadius: '8px', border: 'none',
                background: passwordLoading ? '#94a3b8' : '#1c2333',
                color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
              }}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* 로그아웃 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1c2333', marginBottom: '16px' }}>Session</div>
          <button onClick={() => { logout(); router.push('/login') }}
            style={{
              padding: '10px 18px', borderRadius: '8px',
              border: '0.5px solid #e2e8f0', background: '#fff',
              color: '#c94444', fontSize: '13px', cursor: 'pointer'
            }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}