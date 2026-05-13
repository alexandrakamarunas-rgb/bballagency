'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { Player, PlayerStats, PlayerHighlight } from '@/types'
import { getFlag } from '@/lib/countries'
import UnreadBadge from '@/components/UnreadBadge'

type Tab = 'overview' | 'stats' | 'highlights'

const inputCls = 'w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

function cmToFeet(cm: number) {
  return `${Math.floor(cm / 30.48)}'${Math.round((cm % 30.48) / 2.54)}"`
}

function completion(p: Player | null) {
  if (!p) return 0
  const fields = [p.first_name, p.last_name, p.position, p.height_cm, p.weight_kg, p.nationality, p.date_of_birth, p.photo_url]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return m?.[1] ?? null
}

export default function PlayerDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [highlights, setHighlights] = useState<PlayerHighlight[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [showStatsForm, setShowStatsForm] = useState(false)
  const [showHighlightForm, setShowHighlightForm] = useState(false)

  const fetchData = useCallback(async (uid: string) => {
    const supabase = createClient()
    const [{ data: p }, { data: s }, { data: h }] = await Promise.all([
      supabase.from('players').select('*').eq('id', uid).single(),
      supabase.from('player_stats').select('*').eq('player_id', uid).order('season', { ascending: false }),
      supabase.from('player_highlights').select('*').eq('player_id', uid).order('created_at', { ascending: false }),
    ])
    setPlayer(p)
    setStats(s ?? [])
    setHighlights(h ?? [])
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

  if (loading) return <FullLoader />

  const latestStats = stats[0] ?? null
  const completionPct = completion(player)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/"><span className="text-base font-black tracking-widest">
            <span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span>
            <span className="text-white/40">.com</span>
          </span></Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600 hidden sm:block truncate max-w-[200px]">{email}</span>
            <button onClick={signOut} className="text-xs font-semibold tracking-widest uppercase text-gray-500 hover:text-white transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#080808] shrink-0">
          <div className="p-6 border-b border-white/10">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#111] border border-white/10 mb-4 flex items-center justify-center">
              {player?.photo_url
                ? <img src={player.photo_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-xl font-black text-[#C9A96E]">
                    {player?.first_name?.[0]}{player?.last_name?.[0]}
                  </span>
              }
            </div>
            <p className="text-white font-bold leading-tight">{player?.first_name} {player?.last_name}</p>
            <p className="text-[#C9A96E] text-xs tracking-widest uppercase mt-1">{player?.position ?? 'No position set'}</p>
            {player?.current_team && <p className="text-gray-600 text-xs mt-1">{player.current_team}</p>}
          </div>

          <nav className="p-3 flex-1">
            <button onClick={() => setTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold tracking-wide transition-colors rounded-sm ${tab === 'overview' ? 'bg-[#C9A96E]/10 text-[#C9A96E]' : 'text-gray-500 hover:text-white'}`}>
              <TabIcon t="overview" /> Overview
            </button>
            <Link href="/dashboard/player/stats"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <TabIcon t="stats" /> Stats
            </Link>
            <Link href="/dashboard/player/highlights"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <TabIcon t="highlights" /> Highlights
            </Link>
            <Link href="/dashboard/player/messages"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Messages
              {player?.id && <UnreadBadge userId={player.id} />}
            </Link>
            <div className="my-3 border-t border-white/10" />
            <Link href={`/players/${player?.id}`} target="_blank"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Public Profile
            </Link>
            <Link href="/dashboard/player/profile"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Mobile tabs */}
          <div className="flex gap-1 mb-6 lg:hidden overflow-x-auto no-scrollbar">
            {(['overview', 'stats', 'highlights'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-shrink-0 px-4 py-2 text-xs font-bold tracking-widest uppercase border transition-colors ${
                  tab === t ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/5' : 'border-white/10 text-gray-500'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-1">Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black">
                  WELCOME, <span className="text-[#C9A96E]">{player?.first_name?.toUpperCase()}</span>
                </h1>
              </div>

              {/* Completion */}
              <div className="border border-white/10 bg-[#0d0d0d] p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold tracking-wide">Profile Completion</p>
                  <span className={`text-sm font-black ${completionPct === 100 ? 'text-[#C9A96E]' : 'text-white'}`}>{completionPct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className="h-full bg-[#C9A96E] rounded-full transition-all duration-700"
                    style={{ width: `${completionPct}%` }} />
                </div>
                {completionPct < 100 && (
                  <Link href="/onboarding" className="mt-3 inline-flex items-center gap-1 text-xs text-[#C9A96E] hover:underline">
                    Complete your profile →
                  </Link>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'PPG', value: latestStats?.ppg.toFixed(1) ?? '—' },
                  { label: 'RPG', value: latestStats?.rpg.toFixed(1) ?? '—' },
                  { label: 'APG', value: latestStats?.apg.toFixed(1) ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-white/10 bg-[#0d0d0d] p-5 text-center">
                    <div className="text-3xl font-black text-[#C9A96E] mb-1">{value}</div>
                    <div className="text-[10px] tracking-widest uppercase text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Profile info */}
              <div className="border border-white/10 bg-[#0d0d0d] p-5">
                <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-4">Profile Details</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { term: 'Height', def: player?.height_cm ? `${player.height_cm} cm / ${cmToFeet(player.height_cm)}` : '—' },
                    { term: 'Weight', def: player?.weight_kg ? `${player.weight_kg} kg` : '—' },
                    { term: 'Jersey', def: player?.jersey_number ? `#${player.jersey_number}` : '—' },
                    { term: 'Nationality', def: player?.nationality ? `${getFlag(player.nationality)} ${player.nationality}` : '—' },
                    { term: 'Born', def: player?.date_of_birth ?? '—' },
                    { term: 'Team', def: player?.current_team ?? 'Free Agent' },
                  ].map(({ term, def }) => (
                    <div key={term}>
                      <dt className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{term}</dt>
                      <dd className="text-sm font-semibold">{def}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setTab('stats'); setShowStatsForm(true) }}
                  className="px-5 py-2.5 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A96E] hover:text-black transition-all">
                  + ADD STATS
                </button>
                <button onClick={() => { setTab('highlights'); setShowHighlightForm(true) }}
                  className="px-5 py-2.5 border border-white/20 text-white text-xs font-bold tracking-widest uppercase hover:border-white/40 transition-colors">
                  + ADD HIGHLIGHT
                </button>
                {player?.id && (
                  <Link href={`/players/${player.id}`} target="_blank"
                    className="px-5 py-2.5 border border-white/20 text-white text-xs font-bold tracking-widest uppercase hover:border-white/40 transition-colors">
                    VIEW PUBLIC PROFILE ↗
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ── STATS ── */}
          {tab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">CAREER STATS</h2>
                <button onClick={() => setShowStatsForm(s => !s)}
                  className="px-4 py-2 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A96E] hover:text-black transition-all">
                  {showStatsForm ? 'CANCEL' : '+ ADD SEASON'}
                </button>
              </div>

              {showStatsForm && <AddStatsForm playerId={player?.id ?? ''} onAdded={() => { fetchData(player?.id ?? ''); setShowStatsForm(false) }} />}

              {stats.length === 0 && !showStatsForm ? (
                <EmptyState message="No stats yet. Add your first season." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Season', 'Team', 'League', 'GP', 'PPG', 'RPG', 'APG', 'FG%', '3PT%', 'FT%'].map(h => (
                          <th key={h} className="text-left text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map(s => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 pr-4 font-semibold text-[#C9A96E]">{s.season}</td>
                          <td className="py-3 pr-4 text-gray-300">{s.team}</td>
                          <td className="py-3 pr-4 text-gray-500">{s.league}</td>
                          <td className="py-3 pr-4">{s.games_played}</td>
                          <td className="py-3 pr-4 font-bold">{s.ppg.toFixed(1)}</td>
                          <td className="py-3 pr-4">{s.rpg.toFixed(1)}</td>
                          <td className="py-3 pr-4">{s.apg.toFixed(1)}</td>
                          <td className="py-3 pr-4">{(s.fg_pct * 100).toFixed(1)}%</td>
                          <td className="py-3 pr-4">{(s.three_pct * 100).toFixed(1)}%</td>
                          <td className="py-3 pr-4">{(s.ft_pct * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── HIGHLIGHTS ── */}
          {tab === 'highlights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">HIGHLIGHTS</h2>
                <button onClick={() => setShowHighlightForm(s => !s)}
                  className="px-4 py-2 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A96E] hover:text-black transition-all">
                  {showHighlightForm ? 'CANCEL' : '+ ADD VIDEO'}
                </button>
              </div>

              {showHighlightForm && <AddHighlightForm playerId={player?.id ?? ''} onAdded={() => { fetchData(player?.id ?? ''); setShowHighlightForm(false) }} />}

              {highlights.length === 0 && !showHighlightForm ? (
                <EmptyState message="No highlights yet. Add a YouTube link." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {highlights.map(h => {
                    const vid = getYoutubeId(h.video_url)
                    return (
                      <div key={h.id} className="border border-white/10 bg-[#0d0d0d] overflow-hidden">
                        {vid ? (
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${vid}`}
                              className="w-full h-full" allowFullScreen
                              title={h.title}
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-[#111] flex items-center justify-center">
                            <a href={h.video_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#C9A96E] underline">Open video</a>
                          </div>
                        )}
                        <p className="px-4 py-3 text-sm font-semibold">{h.title}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function AddStatsForm({ playerId, onAdded }: { playerId: string; onAdded: () => void }) {
  const [loading, setLoading] = useState(false)
  const [f, setF] = useState({ season: '', team: '', league: '', games_played: '', ppg: '', rpg: '', apg: '', fg_pct: '', three_pct: '', ft_pct: '' })
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await createClient().from('player_stats').insert({
      player_id: playerId, season: f.season, team: f.team, league: f.league,
      games_played: parseInt(f.games_played),
      ppg: parseFloat(f.ppg), rpg: parseFloat(f.rpg), apg: parseFloat(f.apg),
      fg_pct: parseFloat(f.fg_pct) / 100, three_pct: parseFloat(f.three_pct) / 100, ft_pct: parseFloat(f.ft_pct) / 100,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Stats added!')
    onAdded()
  }

  return (
    <form onSubmit={submit} className="border border-white/10 bg-[#0d0d0d] p-5 space-y-4">
      <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E]">New Season Stats</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { k: 'season', label: 'Season', ph: '2024-25' },
          { k: 'team', label: 'Team', ph: 'Real Madrid' },
          { k: 'league', label: 'League', ph: 'ACB' },
          { k: 'games_played', label: 'GP', ph: '32', type: 'number' },
          { k: 'ppg', label: 'PPG', ph: '18.5', type: 'number' },
          { k: 'rpg', label: 'RPG', ph: '5.2', type: 'number' },
          { k: 'apg', label: 'APG', ph: '4.1', type: 'number' },
          { k: 'fg_pct', label: 'FG%', ph: '47.3', type: 'number' },
          { k: 'three_pct', label: '3PT%', ph: '38.1', type: 'number' },
          { k: 'ft_pct', label: 'FT%', ph: '82.0', type: 'number' },
        ].map(({ k, label, ph, type }) => (
          <div key={k}>
            <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</label>
            <input required type={type ?? 'text'} step="any" className={inputCls} placeholder={ph}
              value={(f as Record<string, string>)[k]} onChange={e => set(k, e.target.value)} />
          </div>
        ))}
      </div>
      <button type="submit" disabled={loading}
        className="px-6 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors disabled:opacity-50">
        {loading ? 'SAVING…' : 'SAVE STATS'}
      </button>
    </form>
  )
}

function AddHighlightForm({ playerId, onAdded }: { playerId: string; onAdded: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await createClient().from('player_highlights').insert({ player_id: playerId, title, video_url: url })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Highlight added!')
    onAdded()
  }

  return (
    <form onSubmit={submit} className="border border-white/10 bg-[#0d0d0d] p-5 space-y-4">
      <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E]">Add Highlight Video</p>
      <div>
        <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">Title</label>
        <input required className={inputCls} placeholder="Season Highlights 2024-25" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">YouTube URL</label>
        <input required type="url" className={inputCls} placeholder="https://youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <button type="submit" disabled={loading}
        className="px-6 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors disabled:opacity-50">
        {loading ? 'SAVING…' : 'ADD HIGHLIGHT'}
      </button>
    </form>
  )
}

function TabIcon({ t }: { t: Tab }) {
  if (t === 'overview') return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" strokeWidth="1.5" /></svg>
  if (t === 'stats') return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-white/10 p-12 flex items-center justify-center">
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}

function FullLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
    </div>
  )
}
