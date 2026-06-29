'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'ti-home' },
  { href: '/dashboard/principles', label: 'Principles', icon: 'ti-notebook' },
  { href: '/dashboard/stats', label: 'Stats', icon: 'ti-chart-bar' },
  { href: '/dashboard/reports', label: 'AI Report', icon: 'ti-sparkles' },
  { href: '/dashboard/market', label: 'Market', icon: 'ti-trending-up' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'ti-settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuthStore()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <aside style={{
        width: '200px', background: '#1c2333', display: 'flex',
        flexDirection: 'column', position: 'fixed', height: '100vh'
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '0.5px solid #2a3347' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#e8eaf0', letterSpacing: '0.06em' }}>TRADY</div>
          <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '3px' }}>Trade Journal</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '13px', textAlign: 'left', transition: 'all 0.15s',
                background: pathname === item.href ? '#253047' : 'transparent',
                color: pathname === item.href ? '#94a3c0' : '#4a5568',
              }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: '15px' }} aria-hidden="true"></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '0.5px solid #2a3347' }}>
          <button onClick={() => { logout(); router.push('/login') }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: '#4a5568', background: 'transparent', textAlign: 'left'
            }}>
            <i className="ti ti-logout" style={{ fontSize: '15px' }} aria-hidden="true"></i>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: '200px' }}>
        {children}
      </main>
    </div>
  )
}