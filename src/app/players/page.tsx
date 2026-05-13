'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PlayerCard, { getLatestStats } from '@/components/PlayerCard'
import { createClient } from '@/utils/supabase/client'
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

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'name',   label: 'Name' },
  { key: 'ppg',    label: 'PPG' },
  { key: 'height', label: 'Height' },
]

export default function PlayersPage() {
  const [allPlayers, setAllPlayers] = useState<PlayerWithStats[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [search, setSearch]               = useState('')
  const [positions, setPositions]         = useState<string[]>([])
  const [nationality, setNationality]     = useState('')
  const [minHeight, setMinHeight]         = useState(170)
  const [maxHeight, setMaxHeight]         = useState(220)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy]               = useState<SortKey>('newest')

  const fetchPlayers = useCallback(async (reset = false) => {
    reset ? setLoading(true) : setLoadingMore(true)

    const supabase = createClient()
    let query = supabase
      .from('players')
      .select('*, player_stats(ppg, rpg, apg, season)', { count: 'exact' })

    if (positions.length)  query = query.in('position', positions.map(p => POSITIONS.find(x => x.code === p)?.label).filter(Boolean) as string[])
    if (nationality)       query = query.eq('nationality', nationality)
    if (minHeight > 170)   query = query.gte('height_cm', minHeight)
    if (maxHeight < 220)   query = query.lte('height_cm', maxHeight)
    if (availableOnly)     query = query.is('current_team', null)

    query = query.range(0, (reset ? 1 : page) * PAGE_SIZE - 1)

    const { data, count } = await query
    setAllPlayers((data ?? []) as PlayerWithStats[])
    setTotal(count ?? 0)
    if (reset) { setPage(1); setLoading(false) } else setLoadingMore(false)
  }, [positions, nationality, minHeight, maxHeight, availableOnly, page])

  useEffect(() => { fetchPlayers(true) }, [positions, nationality, minHeight, maxHeight, availableOnly])
  useEffect(() => { if (page > 1) fetchPlayers(false) }, [page])

  const sorted = useMemo(() => {
    const filtered = search
      ? allPlayers.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()))
      : allPlayers

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`)
      if (sortBy === 'ppg') return (getLatestStats(b.player_stats)?.ppg ?? 0) - (getLatestStats(a.player_stats)?.ppg ?? 0)
      if (sortBy === 'height') return (b.height_cm ?? 0) - (a.height_cm ?? 0)
      return 0 // newest = db order
    })
  }, [allPlayers, search, sortBy])

  function togglePosition(code: string) {
    setPositions(p => p.includes(code) ? p.filter(x => x !== code) : [...p, code])
  }

  const hasMore = allPlayers.length < total

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-[#0a0a0a]">
        {/* Page header */}
        <div className="border-b border-white/10 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Our Roster</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                ALL <span className="text-[#C9A96E]">PLAYERS</span>
              </h1>
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
                  className="w-full bg-[#111] border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/50 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Filter sidebar ── */}
            <aside className="w-full lg:w-60 shrink-0">
              <div className="lg:sticky lg:top-24 space-y-7">

                {/* Position */}
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">Position</p>
                  <div className="space-y-2">
                    {POSITIONS.map(({ code, label }) => (
                      <label key={code} className="flex items-center gap-3 cursor-pointer group">
                        <div onClick={() => togglePosition(code)}
                          className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${positions.includes(code) ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/20 group-hover:border-white/40'}`}>
                          {positions.includes(code) && (
                            <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm transition-colors ${positions.includes(code) ? 'text-[#C9A96E]' : 'text-gray-400 group-hover:text-white'}`}>
                          <span className="font-bold">{code}</span> · {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nationality */}
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">Nationality</p>
                  <div className="relative">
                    <select value={nationality} onChange={e => setNationality(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-[#C9A96E]/50 transition-colors">
                      <option value="">All countries</option>
                      {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Height range */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] tracking-widest uppercase text-gray-500">Height</p>
                    <p className="text-[10px] text-[#C9A96E]">{minHeight}–{maxHeight} cm</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Min: {minHeight}cm</p>
                      <input type="range" min={170} max={220} step={1} value={minHeight}
                        onChange={e => setMinHeight(Math.min(+e.target.value, maxHeight - 2))}
                        className="w-full" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Max: {maxHeight}cm</p>
                      <input type="range" min={170} max={220} step={1} value={maxHeight}
                        onChange={e => setMaxHeight(Math.max(+e.target.value, minHeight + 2))}
                        className="w-full" />
                    </div>
                  </div>
                </div>

                {/* Available only */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setAvailableOnly(v => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${availableOnly ? 'bg-[#C9A96E]' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-400">Free agents only</span>
                  </label>
                </div>

                {/* Reset */}
                {(positions.length || nationality || minHeight > 170 || maxHeight < 220 || availableOnly) ? (
                  <button onClick={() => { setPositions([]); setNationality(''); setMinHeight(170); setMaxHeight(220); setAvailableOnly(false) }}
                    className="w-full py-2 border border-white/10 text-xs text-gray-500 hover:text-white hover:border-white/20 transition-colors tracking-widest uppercase">
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </aside>

            {/* ── Grid ── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <p className="text-xs text-gray-500">
                  {loading ? 'Loading…' : `${sorted.length} player${sorted.length !== 1 ? 's' : ''}${total > allPlayers.length ? ` of ${total}` : ''}`}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest hidden sm:block">Sort:</p>
                  {SORTS.map(({ key, label }) => (
                    <button key={key} onClick={() => setSortBy(key)}
                      className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${sortBy === key ? 'bg-[#C9A96E] text-black' : 'border border-white/10 text-gray-500 hover:text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border border-white/5 bg-[#0d0d0d] h-96 animate-pulse" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="border border-dashed border-white/10 p-20 text-center">
                  <p className="text-gray-600 text-sm mb-3">No players found.</p>
                  <button onClick={() => { setPositions([]); setNationality(''); setSearch(''); setMinHeight(170); setMaxHeight(220); setAvailableOnly(false) }}
                    className="text-xs text-[#C9A96E] hover:underline">Clear all filters</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {sorted.map(player => (
                      <PlayerCard key={player.id} player={player} action="view" />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-10 flex justify-center">
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
      </main>
      <Footer />
    </>
  )
}
