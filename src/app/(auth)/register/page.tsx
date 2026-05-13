'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { Role } from '@/types'

const ROLES: { id: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'player', label: 'Player', desc: 'Athlete seeking representation',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'team', label: 'Team', desc: 'Club or organization',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'agent', label: 'Agent', desc: 'Licensed sports agent',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('player')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role } },
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    const user = data.user
    if (data.session) {
      toast.success('Account created!')
      const dest = role === 'player' ? '/onboarding/player' : role === 'agent' ? '/onboarding/agent' : '/onboarding/team'
      router.push(dest)
    } else {
      toast.success('Check your email to confirm your account.')
      router.push('/login')
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Join the Agency</p>
        <h1 className="text-3xl font-black tracking-tight">CREATE YOUR ACCOUNT</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role cards */}
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-3">I am a…</p>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map(({ id, label, desc, icon }) => (
              <button key={id} type="button" onClick={() => setRole(id)}
                className={`flex flex-col items-center gap-2 p-4 border text-center transition-all ${
                  role === id
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5 text-[#C9A96E]'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}>
                {icon}
                <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
                <span className="text-[10px] text-gray-600 leading-tight hidden sm:block">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">Confirm Password</label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password" className={inputCls} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
          {loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-[#C9A96E] font-semibold hover:underline">LOGIN</Link>
      </p>
    </div>
  )
}
