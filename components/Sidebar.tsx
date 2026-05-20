'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/',        icon: 'add_circle', label: 'New Draw'     },
  { href: '/history', icon: 'history',    label: 'Draw History' },
  { href: '/settings',icon: 'settings',   label: 'Settings'     },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-low flex flex-col py-8 z-50 border-r border-outline-variant/50">
      {/* Brand */}
      <div className="px-6 mb-10">
        <h1
          className="text-2xl font-bold text-primary"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Easy Gold
        </h1>
        <p className="text-[13px] text-on-surface-variant opacity-70 mt-0.5">
          Premium Raffle Management
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-5 py-3 text-[13px] font-semibold tracking-widest uppercase transition-all duration-200 ${
              isActive(href)
                ? 'text-primary border-l-4 border-primary bg-surface-variant/30 translate-x-px'
                : 'text-on-surface-variant border-l-4 border-transparent hover:bg-surface-container-highest hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isActive(href) ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {icon}
            </span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Launch CTA */}
      <div className="px-5 mb-6">
        <button
          onClick={() => router.push('/')}
          className="relative w-full py-3.5 bg-primary text-on-primary rounded-lg font-bold text-[13px] uppercase tracking-widest overflow-hidden hover:shadow-[0_0_24px_rgba(237,192,101,0.3)] transition-shadow active:scale-95"
        >
          <span className="shimmer-btn absolute inset-0 opacity-60" />
          <span className="relative z-10">Launch Raffle</span>
        </button>
      </div>

      {/* Footer links */}
      <div className="px-2 border-t border-outline-variant/30 pt-4 space-y-0.5">
        <a className="flex items-center gap-3 px-5 py-2.5 text-[13px] text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded">
          <span className="material-symbols-outlined text-[18px] opacity-60">help</span>
          Support
        </a>
        <a className="flex items-center gap-3 px-5 py-2.5 text-[13px] text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded">
          <span className="material-symbols-outlined text-[18px] opacity-60">logout</span>
          Logout
        </a>
      </div>
    </aside>
  )
}
