'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { Agent } from '@/types'
import UnreadBadge from '@/components/UnreadBadge'

type Tab = 'overview' | 'players' | 'settings'

export default function AgentDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [agent, setAgent] = useState<Agent | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (uid: string) => {
    const { data } = await createClient().from('agents').select('*').eq('id', uid).single()
    setAgent(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setEmail(data.user.email ?? '')
      fetchData(data.user.id)
    })
  }, [router, fetchData])

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  if (loading) return <Loader />

  const name = [agent?.first_name, agent?.last_name].filter(Boolean).join(' ') || 'Agent'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span><span className="text-white/40">.com</span></span></Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600 hidden sm:block truncate max-w-[200px]">{email}</span>
            <button onClick={signOut} className="text-xs font-semibold tracking-widest uppercase text-gray-500 hover:text-white transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#080808] shrink-0">
          <div className="p-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#111] border border-white/10 mb-4 flex items-center justify-center">
              {agent?.photo_url
                ? <img src={agent.photo_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-xl font-black text-[#C9A96E]">{agent?.first_name?.[0]}{agent?.last_name?.[0]}</span>
              }
            </div>
            <p className="text-white font-bold leading-tight">{name}</p>
            <p className="text-[#C9A96E] text-xs tracking-widest uppercase mt-1">{agent?.agency_name ?? 'Agent'}</p>
            {agent?.years_experience && <p className="text-gray-600 text-xs mt-1">{agent.years_experience} yrs experience</p>}
          </div>
          <nav className="p-3 flex-1">
            {([['overview', 'Overview'], ['players', 'My Players'], ['settings', 'Settings']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold tracking-wide transition-colors rounded-sm ${tab === t ? 'bg-[#C9A96E]/10 text-[#C9A96E]' : 'text-gray-500 hover:text-white'}`}>
                <AgentTabIcon t={t} />{label}
              </button>
            ))}
            <div className="my-3 border-t border-white/10" />
            <Link href="/dashboard/agent/messages"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Messages
              {agent?.id && <UnreadBadge userId={agent.id} />}
            </Link>
            <Link href="/dashboard/agent/players" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              My Players
            </Link>
            <Link href="/players" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="1.5" /><path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Find Players
            </Link>
            <Link href="/onboarding/agent" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit Profile
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Mobile tabs */}
          <div className="flex gap-1 mb-6 lg:hidden overflow-x-auto no-scrollbar">
            {(['overview', 'players', 'settings'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-shrink-0 px-4 py-2 text-xs font-bold tracking-widest uppercase border transition-colors ${tab === t ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/5' : 'border-white/10 text-gray-500'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-1">Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black">WELCOME, <span className="text-[#C9A96E]">{agent?.first_name?.toUpperCase() ?? 'AGENT'}</span></h1>
              </div>

              {/* Profile card */}
              <div className="border border-white/10 bg-[#0d0d0d] p-5">
                <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-4">Agency Profile</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { term: 'Agency', def: agent?.agency_name ?? '—' },
                    { term: 'Experience', def: agent?.years_experience ? `${agent.years_experience} years` : '—' },
                    { term: 'Phone', def: agent?.phone ?? '—' },
                    { term: 'WhatsApp', def: agent?.whatsapp ?? '—' },
                    { term: 'Languages', def: agent?.languages?.slice(0, 3).join(', ') ?? '—' },
                    { term: 'Countries', def: agent?.countries ? `${agent.countries.length} countries` : '—' },
                  ].map(({ term, def }) => (
                    <div key={term}>
                      <dt className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{term}</dt>
                      <dd className="text-sm font-semibold truncate">{def}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Bio */}
              {agent?.bio && (
                <div className="border border-white/10 bg-[#0d0d0d] p-5">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-3">About</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{agent.bio}</p>
                </div>
              )}

              {/* Countries & languages tags */}
              {(agent?.countries?.length || agent?.languages?.length) ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {agent.countries?.length ? (
                    <div className="border border-white/10 bg-[#0d0d0d] p-5">
                      <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-3">Countries</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.countries.map(c => <span key={c} className="px-2.5 py-1 bg-white/5 text-xs text-gray-300">{c}</span>)}
                      </div>
                    </div>
                  ) : null}
                  {agent.languages?.length ? (
                    <div className="border border-white/10 bg-[#0d0d0d] p-5">
                      <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-3">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.languages.map(l => <span key={l} className="px-2.5 py-1 bg-white/5 text-xs text-gray-300">{l}</span>)}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Quick actions */}
              <div className="flex flex-wrap gap-3">
                <Link href="/players" className="px-5 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors">
                  BROWSE PLAYERS
                </Link>
                <Link href="/onboarding/agent" className="px-5 py-2.5 border border-white/20 text-white text-xs font-bold tracking-widest uppercase hover:border-white/40 transition-colors">
                  EDIT PROFILE
                </Link>
              </div>
            </div>
          )}

          {tab === 'players' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black">MY PLAYERS</h2>
              <div className="border border-dashed border-white/10 p-16 flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-gray-600">Player management coming soon.</p>
                <Link href="/players" className="px-5 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors">
                  FIND PLAYERS NOW
                </Link>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black">SETTINGS</h2>
              <div className="border border-white/10 bg-[#0d0d0d] p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1">Edit Agent Profile</p>
                  <p className="text-xs text-gray-500">Update your agency info, bio, and photo</p>
                </div>
                <Link href="/onboarding/agent" className="px-4 py-2 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A96E] hover:text-black transition-all">
                  EDIT
                </Link>
              </div>
              <div className="border border-white/10 bg-[#0d0d0d] p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1">Sign Out</p>
                  <p className="text-xs text-gray-500">Sign out of your account</p>
                </div>
                <button onClick={signOut} className="px-4 py-2 border border-white/20 text-white text-xs font-bold tracking-widest uppercase hover:border-white/40 transition-colors">
                  SIGN OUT
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function AgentTabIcon({ t }: { t: Tab }) {
  if (t === 'overview') return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" strokeWidth="1.5" /></svg>
  if (t === 'players') return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

function Loader() {
  return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" /></div>
}
