'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import PlayerCard, { getLatestStats } from '@/components/PlayerCard'
import { COUNTRIES } from '@/lib/countries'
import type { PlayerWithStats } from '@/types'

const PAGE_SIZE = 12
const POSITIONS = [
  { code: 'PG', label: 'Point Guard' },
  { code: 'SG', label: 'Shooting Guard' },
  { code: 'SF', label: 'Small Forward' },
  { code: 'PF', label: 'Power Forward' },
  { code: 'C',  label: 'Center' },
]

type SortKey = 'name' | 'ppg' | 'height' | 'newest'

function getAge(dob: string | null) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

export default function TeamSearchPage() {
  const router = useRouter()
  const [userId, setUserId]       = useState<string | null>(null)
  const [players, setPlayers]     = useState<PlayerWithStats[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [search, setSearch]           = useState('')
  const [positions, setPositions]     = useState<string[]>([])
  const [nationality, setNationality] = useState('')
  const [minHeight, setMinHeight]     = useState(170)
  const [maxHeight, setMaxHeight]     = useState(220)
  const [minAge, setMinAge]           = useState(16)
  const [maxAge, setMaxAge]           = useState(40)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy]           = useState<SortKey>('newest')

  // Contact modal
  const [modal, setModal]     = useState<{ player: PlayerWithStats } | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  const fetchPlayers = useCallback(async (reset = false) => {
    reset ? setLoading(true) : setLoadingMore(true)
    const supabase = createClient()

    let query = supabase
      .from('players')
      .select('*, player_stats(ppg, rpg, apg, season)', { count: 'exact' })

    if (positions.length) query = query.in('position', positions.map(p => POSITIONS.find(x => x.code === p)?.label).filter(Boolean) as string[])
    if (nationality)      query = query.eq('nationality', nationality)
    if (minHeight > 170)  query = query.gte('height_cm', minHeight)
    if (maxHeight < 220)  query = query.lte('height_cm', maxHeight)
    if (availableOnly)    query = query.is('current_team', null)

    // Age range via date_of_birth
    if (maxAge < 40) {
      const minDob = new Date(); minDob.setFullYear(minDob.getFullYear() - maxAge)
      query = query.gte('date_of_birth', minDob.toISOString().split('T')[0])
    }
    if (minAge > 16) {
      const maxDob = new Date(); maxDob.setFullYear(maxDob.getFullYear() - minAge)
      query = query.lte('date_of_birth', maxDob.toISOString().split('T')[0])
    }

    query = query.range(0, (reset ? 1 : page) * PAGE_SIZE - 1)

    const { data, count } = await query
    setPlayers((data ?? []) as PlayerWithStats[])
    setTotal(count ?? 0)
    if (reset) { setPage(1); setLoading(false) } else setLoadingMore(false)
  }, [positions, nationality, minHeight, maxHeight, availableOnly, minAge, maxAge, page])

  useEffect(() => { if (userId) fetchPlayers(true) }, [userId, positions, nationality, minHeight, maxHeight, availableOnly, minAge, maxAge])
  useEffect(() => { if (page > 1 && userId) fetchPlayers(false) }, [page])

  const sorted = useMemo(() => {
    const filtered = search
      ? players.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()))
      : players
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name')   return `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`)
      if (sortBy === 'ppg')    return (getLatestStats(b.player_stats)?.ppg ?? 0) - (getLatestStats(a.player_stats)?.ppg ?? 0)
      if (sortBy === 'height') return (b.height_cm ?? 0) - (a.height_cm ?? 0)
      return 0
    })
  }, [players, search, sortBy])

  function togglePosition(code: string) {
    setPositions(p => p.includes(code) ? p.filter(x => x !== code) : [...p, code])
  }

  async function sendOffer() {
    if (!modal || !userId || !body.trim()) { toast.error('Please write a message'); return }
    setSending(true)
    const { error } = await createClient().from('messages').insert({
      from_id: userId, to_id: modal.player.id,
      subject: subject || `Interest in ${modal.player.first_name} ${modal.player.last_name}`,
      body,
    })
    setSending(false)
    if (error) { toast.error(error.message); return }
    toast.success('Offer sent!')
    setModal(null); setSubject(''); setBody('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/team" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span></span></Link>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players…"
              className="bg-[#111] border border-white/10 pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/50 transition-colors w-48 sm:w-64" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-1">Team Dashboard</p>
          <h1 className="text-3xl font-black">SEARCH <span className="text-[#C9A96E]">PLAYERS</span></h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Position */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">Position</p>
                <div className="space-y-2">
                  {POSITIONS.map(({ code, label }) => (
                    <label key={code} className="flex items-center gap-3 cursor-pointer group" onClick={() => togglePosition(code)}>
                      <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${positions.includes(code) ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/20'}`}>
                        {positions.includes(code) && <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </div>
                      <span className={`text-sm ${positions.includes(code) ? 'text-[#C9A96E]' : 'text-gray-400'}`}><span className="font-bold">{code}</span> · {label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nationality */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">Nationality</p>
                <div className="relative">
                  <select value={nationality} onChange={e => setNationality(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#C9A96E]/50 transition-colors">
                    <option value="">All countries</option>
                    {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Height */}
              <div>
                <div className="flex justify-between mb-2"><p className="text-[10px] tracking-widest uppercase text-gray-500">Height</p><p className="text-[10px] text-[#C9A96E]">{minHeight}–{maxHeight}cm</p></div>
                <div className="space-y-2">
                  <div><p className="text-[9px] text-gray-600 mb-1">Min {minHeight}cm</p><input type="range" min={170} max={220} value={minHeight} onChange={e => setMinHeight(Math.min(+e.target.value, maxHeight - 2))} className="w-full" /></div>
                  <div><p className="text-[9px] text-gray-600 mb-1">Max {maxHeight}cm</p><input type="range" min={170} max={220} value={maxHeight} onChange={e => setMaxHeight(Math.max(+e.target.value, minHeight + 2))} className="w-full" /></div>
                </div>
              </div>

              {/* Age */}
              <div>
                <div className="flex justify-between mb-2"><p className="text-[10px] tracking-widest uppercase text-gray-500">Age</p><p className="text-[10px] text-[#C9A96E]">{minAge}–{maxAge} yrs</p></div>
                <div className="space-y-2">
                  <div><p className="text-[9px] text-gray-600 mb-1">Min {minAge}</p><input type="range" min={16} max={45} value={minAge} onChange={e => setMinAge(Math.min(+e.target.value, maxAge - 1))} className="w-full" /></div>
                  <div><p className="text-[9px] text-gray-600 mb-1">Max {maxAge}</p><input type="range" min={16} max={45} value={maxAge} onChange={e => setMaxAge(Math.max(+e.target.value, minAge + 1))} className="w-full" /></div>
                </div>
              </div>

              {/* Free agents */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setAvailableOnly(v => !v)}
                  className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${availableOnly ? 'bg-[#C9A96E]' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-400">Free agents only</span>
              </label>

              {/* Sort */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">Sort by</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['newest', 'name', 'ppg', 'height'] as SortKey[]).map(k => (
                    <button key={k} onClick={() => setSortBy(k)}
                      className={`py-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${sortBy === k ? 'bg-[#C9A96E] text-black' : 'border border-white/10 text-gray-500 hover:text-white'}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-gray-500">{loading ? 'Loading…' : `${sorted.length} player${sorted.length !== 1 ? 's' : ''}`}</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="border border-white/5 bg-[#0d0d0d] h-96 animate-pulse" />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="border border-dashed border-white/10 p-20 text-center">
                <p className="text-gray-600 text-sm">No players match your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {sorted.map(player => (
                    <PlayerCard key={player.id} player={player} action="contact" onContact={p => setModal({ player: p })} />
                  ))}
                </div>
                {players.length < total && (
                  <div className="mt-8 flex justify-center">
                    <button onClick={() => setPage(p => p + 1)} disabled={loadingMore}
                      className="px-10 py-3 border border-white/20 text-sm font-bold tracking-widest uppercase text-gray-400 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors disabled:opacity-50">
                      {loadingMore ? 'LOADING…' : 'LOAD MORE'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#C9A96E] mb-1">Send Offer</p>
                <h3 className="text-xl font-black">CONTACT {modal.player.last_name?.toUpperCase()}</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-gray-500 mb-2">Subject <span className="text-gray-700 normal-case">(optional)</span></label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={`Interest in ${modal.player.first_name} ${modal.player.last_name}`}
                className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-gray-500 mb-2">Message</label>
              <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your club, the offer, contract length, expectations…"
                className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/50 transition-colors resize-none" />
            </div>
            <button onClick={sendOffer} disabled={sending || !body.trim()}
              className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
              {sending ? 'SENDING…' : 'SEND OFFER →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
