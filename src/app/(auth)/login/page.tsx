'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    const role = profile?.role ?? 'player'

    if (role === 'agent') {
      const { data: agent } = await supabase.from('agents').select('id').eq('id', data.user.id).maybeSingle()
      router.push(agent ? '/dashboard/agent' : '/onboarding/agent')
    } else if (role === 'team') {
      const { data: team } = await supabase.from('teams').select('id').eq('id', data.user.id).maybeSingle()
      router.push(team ? '/dashboard/team' : '/onboarding/team')
    } else {
      const { data: player } = await supabase.from('players').select('id').eq('id', data.user.id).maybeSingle()
      router.push(player ? '/dashboard/player' : '/onboarding/player')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Members Area</p>
        <h1 className="text-3xl font-black tracking-tight">WELCOME BACK</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" className={inputCls} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] tracking-[0.25em] uppercase text-gray-500">Password</label>
            <Link href="/forgot-password" className="text-[10px] uppercase tracking-wider text-gray-500 hover:text-[#C9A96E] transition-colors">
              Forgot password?
            </Link>
          </div>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Your password" className={inputCls} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
          {loading ? 'LOGGING IN…' : 'LOGIN'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#C9A96E] font-semibold hover:underline">REGISTER</Link>
      </p>
    </div>
  )
}
