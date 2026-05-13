'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export interface UserInfo {
  id: string
  email: string
  role: string
  displayName: string
  avatarLetter: string
  dashboardHref: string
  profileHref: string
  unreadCount: number
}

const navLinks = [
  { label: 'Players',   href: '/players' },
  { label: 'Teams',     href: '/teams' },
  { label: 'Positions', href: '/positions' },
  { label: 'Agents',    href: '/agents' },
  { label: 'About Us',  href: '/about' },
  { label: 'Contact',   href: '/contact' },
]

export default function HeaderClient({ user }: { user: UserInfo | null }) {
  const router = useRouter()
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function logout() {
    await createClient().auth.signOut()
    setDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-lg sm:text-xl font-black tracking-widest">
              <span className="text-white">BBALL</span>
              <span className="text-[#C9A96E]">AGENCY</span>
              <span className="text-white/60">.com</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, href }) => (
              <Link key={label} href={href}
                className="text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Avatar button */}
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="relative w-9 h-9 rounded-full bg-[#C9A96E]/15 border-2 border-[#C9A96E] flex items-center justify-center font-black text-[#C9A96E] text-sm hover:bg-[#C9A96E]/25 transition-colors"
                  aria-label="User menu"
                >
                  {user.avatarLetter}
                  {user.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-black">
                      {user.unreadCount > 9 ? '9+' : user.unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#111] border border-white/10 shadow-xl z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[10px] text-gray-600 truncate">{user.email}</p>
                      <p className="text-[9px] text-[#C9A96E] uppercase tracking-widest mt-0.5">{user.role}</p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link href={user.dashboardHref} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" strokeWidth="1.5" />
                          <rect x="3" y="14" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" strokeWidth="1.5" />
                        </svg>
                        My Dashboard
                      </Link>
                      <Link href={user.profileHref} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <Link href={`${user.dashboardHref}/messages`} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Messages
                        {user.unreadCount > 0 && (
                          <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                            {user.unreadCount > 9 ? '9+' : user.unreadCount}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="border-t border-white/10 py-1">
                      <button onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/register"
                className="px-5 py-2 text-xs font-bold tracking-widest uppercase border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-black transition-all">
                JOIN US
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-1 text-white" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-250 ease-in-out ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="border-t border-white/10 py-5 space-y-3">
            {navLinks.map(({ label, href }) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}
                className="block text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white py-1 transition-colors">
                {label}
              </Link>
            ))}

            <div className="pt-3 border-t border-white/10">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-[#C9A96E]/15 border border-[#C9A96E] flex items-center justify-center font-black text-[#C9A96E] text-sm">
                      {user.avatarLetter}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.displayName}</p>
                      <p className="text-[10px] text-[#C9A96E] uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                  <Link href={user.dashboardHref} onClick={() => setMenuOpen(false)}
                    className="block text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white py-1">
                    My Dashboard
                  </Link>
                  <Link href={user.profileHref} onClick={() => setMenuOpen(false)}
                    className="block text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white py-1">
                    My Profile
                  </Link>
                  <button onClick={logout} className="text-xs font-semibold tracking-widest uppercase text-gray-600 hover:text-red-400 py-1 transition-colors">
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="inline-block px-5 py-2 text-xs font-bold tracking-widest uppercase border border-[#C9A96E] text-[#C9A96E]">
                  JOIN US
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
