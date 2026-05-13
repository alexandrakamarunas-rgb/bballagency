'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/client'
import { COUNTRIES } from '@/lib/countries'
import { getFlag } from '@/lib/countries'
import type { PositionWithTeam } from '@/types'

const POSITION_MAP: Record<string, string> = {
  PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward',
  PF: 'Power Forward', C: 'Center',
}
const POSITIONS = Object.keys(POSITION_MAP)
const LEAGUE_LEVELS = ['Professional', 'Semi-Professional', 'Amateur']
const BUDGET_LABELS = ['Under €50K', '€50K – €100K', '€100K – €200K', '€200K – €500K', '€500K+']

type SortKey = 'newest' | 'position' | 'country' | 'league'

function levelBadge(level: string | null) {
  if (!level) return null
  const styles: Record<string, string> = {
    'Professional':     'border-[#C9A96E]/50 text-[#C9A96E]',
    'Semi-Professional':'border-white/20 text-gray-400',
    'Amateur':          'border-white/10 text-gray-600',
  }
  return (
    <span className={`px-2 py-0.5 border text-[9px] font-bold tracking-widest uppercase ${styles[level] ?? 'border-white/10 text-gray-600'}`}>
      {level === 'Semi-Professional' ? 'Semi-Pro' : level}
    </span>
  )
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<PositionWithTeam[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selPos, setSelPos]       = useState<string[]>([])
  const [country, setCountry]     = useState('')
  const [level, setLevel]         = useState('')
  const [budget, setBudget]       = useState('')
  const [sortBy, setSortBy]       = useState<SortKey>('newest')

  useEffect(() => {
    createClient()
      .from('positions')
      .select('*, teams(id, club_name, country, city, logo_url, league_name, league_level, season)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPositions((data ?? []) as PositionWithTeam[]); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    let list = positions.filter(p => {
      const q = search.toLowerCase()
      if (q && !p.teams?.club_name?.toLowerCase().includes(q) && !p.position.toLowerCase().includes(q) && !POSITION_MAP[p.position]?.toLowerCase().includes(q)) return false
      if (selPos.length && !selPos.includes(p.position)) return false
      if (country && p.teams?.country !== country) return false
      if (level && p.teams?.league_level !== level) return false
      if (budget && p.budget_range !== budget) return false
      return true
    })
    return [...list].sort((a, b) => {
      if (sortBy === 'position') return a.position.localeCompare(b.position)
      if (sortBy === 'country') return (a.teams?.country ?? '').localeCompare(b.teams?.country ?? '')
      if (sortBy === 'league') return (a.teams?.league_level ?? '').localeCompare(b.teams?.league_level ?? '')
      return 0
    })
  }, [positions, search, selPos, country, level, budget, sortBy])

  const hasFilters = selPos.length || country || level || budget || search
  function clearAll() { setSelPos([]); setCountry(''); setLevel(''); setBudget(''); setSearch('') }
  function togglePos(p: string) { setSelPos(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]) }

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-[#0a0a0a]">
        {/* Page header */}
        <div className="border-b border-white/10 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Club Openings</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                OPEN <span className="text-[#C9A96E]">POSITIONS</span>
              </h1>
              <div className="relative w-full sm:w-72">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Club name or position…"
                  className="w-full bg-[#111] border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/50 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="w-full lg:w-60 shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">

                {/* Position */}
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">Position</p>
                  <div className="space-y-2">
                    {POSITIONS.map(pos => (
                      <label key={pos} className="flex items-center gap-3 cursor-pointer" onClick={() => togglePos(pos)}>
                        <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${selPos.includes(pos) ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/20'}`}>
                          {selPos.includes(pos) && <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span className={`text-sm ${selPos.includes(pos) ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                          <span className="font-bold">{pos}</span> · {POSITION_MAP[pos]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">Country</p>
                  <div className="relative">
                    <select value={country} onChange={e => setCountry(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#C9A96E]/50 transition-colors">
                      <option value="">All countries</option>
                      {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* League Level */}
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">League Level</p>
                  <div className="relative">
                    <select value={level} onChange={e => setLevel(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#C9A96E]/50 transition-colors">
                      <option value="">All levels</option>
                      {LEAGUE_LEVELS.map(l => <option key={l} value={l} className="bg-[#111]">{l}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">Budget Range</p>
                  <div className="relative">
                    <select value={budget} onChange={e => setBudget(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#C9A96E]/50 transition-colors">
                      <option value="">Any budget</option>
                      {BUDGET_LABELS.map(b => <option key={b} value={b} className="bg-[#111]">{b}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {hasFilters && (
                  <button onClick={clearAll} className="w-full py-2 border border-white/10 text-xs text-gray-500 hover:text-white hover:border-white/20 transition-colors tracking-widest uppercase">
                    Clear Filters
                  </button>
                )}
              </div>
            </aside>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <p className="text-xs text-gray-500">{loading ? 'Loading…' : `${filtered.length} position${filtered.length !== 1 ? 's' : ''}`}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest hidden sm:block">Sort:</p>
                  {(['newest','position','country','league'] as SortKey[]).map(k => (
                    <button key={k} onClick={() => setSortBy(k)}
                      className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${sortBy === k ? 'bg-[#C9A96E] text-black' : 'border border-white/10 text-gray-500 hover:text-white'}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="border border-white/5 bg-[#0d0d0d] h-72 animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="border border-dashed border-white/10 p-16 text-center">
                  <p className="text-gray-600 text-sm mb-3">No positions match your filters.</p>
                  {hasFilters && <button onClick={clearAll} className="text-xs text-[#C9A96E] hover:underline">Clear filters</button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(pos => (
                    <div key={pos.id} className="group flex flex-col border border-white/10 bg-[#0d0d0d] hover:border-[#C9A96E]/40 transition-[border-color] duration-200 overflow-hidden">
                      {/* Top area */}
                      <div className="p-5 flex items-start gap-4 border-b border-white/10">
                        {/* Club logo */}
                        <div className="w-12 h-12 bg-[#111] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {pos.teams?.logo_url
                            ? <img src={pos.teams.logo_url} alt={pos.teams.club_name} className="w-full h-full object-contain p-1" />
                            : <span className="text-lg font-black text-[#C9A96E]">{pos.teams?.club_name?.[0]}</span>
                          }
                        </div>
                        {/* Position */}
                        <div className="flex-1 min-w-0">
                          <div className="text-4xl font-black text-[#C9A96E] leading-none mb-1">{pos.position}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider">{POSITION_MAP[pos.position]}</div>
                        </div>
                      </div>

                      {/* Club info */}
                      <div className="p-5 flex-1 space-y-2">
                        <p className="font-bold text-white text-sm leading-tight">{pos.teams?.club_name}</p>
                        {pos.teams?.country && (
                          <p className="text-xs text-gray-400">{getFlag(pos.teams.country)} {pos.teams.country}{pos.teams.city ? ` · ${pos.teams.city}` : ''}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {pos.teams?.league_name && <span className="text-xs text-gray-500">{pos.teams.league_name}</span>}
                          {pos.teams?.league_level && levelBadge(pos.teams.league_level)}
                        </div>
                        {pos.budget_range && (
                          <p className="text-xs text-gray-500">
                            <span className="text-gray-700 uppercase tracking-wider text-[9px]">Budget: </span>
                            {pos.budget_range}
                          </p>
                        )}
                        {pos.requirements && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{pos.requirements}</p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="px-5 pb-5">
                        <Link href={`/positions/${pos.id}`}
                          className="block w-full py-2.5 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-[0.2em] uppercase text-center hover:bg-[#C9A96E] hover:text-black transition-all">
                          VIEW DETAILS
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
