'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const navItems = [
  { href: '/dashboard', label: '홈', icon: '🏠' },
  { href: '/dashboard/principles', label: '투자 원칙', icon: '📋' },
  { href: '/dashboard/stats', label: '통계', icon: '📊' },
  { href: '/dashboard/reports', label: 'AI 리포트', icon: '🤖' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* 사이드바 */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="px-5 py-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">📒 Trady</h1>
          <p className="text-xs text-gray-400 mt-1">뇌동매매 없는 투자 습관</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left
                ${pathname === item.href
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={() => { logout(); router.push('/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors text-left">
            <span>🚪</span>
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 ml-56">
        {children}
      </main>
    </div>
  )
}