'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { getFlag } from '@/lib/countries'
import type { PlayerWithStats } from '@/types'

function getLatestStats(stats: PlayerWithStats['player_stats']) {
  if (!stats?.length) return null
  return [...stats].sort((a, b) => b.season.localeCompare(a.season))[0]
}

function cmToFeet(cm: number) {
  return `${Math.floor(cm / 30.48)}'${Math.round((cm % 30.48) / 2.54)}"`
}

export default function AgentPlayersPage() {
  const router = useRouter()
  const [userId, setUserId]           = useState<string | null>(null)
  const [myPlayers, setMyPlayers]     = useState<PlayerWithStats[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [removing, setRemoving]       = useState<string | null>(null)

  // Add modal state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlayerWithStats[]>([])
  const [searching, setSearching]     = useState(false)
  const [adding, setAdding]           = useState<string | null>(null)

  const fetchMyPlayers = useCallback(async (uid: string) => {
    const { data } = await createClient()
      .from('agent_players')
      .select('player_id, players(*, player_stats(ppg, rpg, apg, season))')
      .eq('agent_id', uid)
    setMyPlayers((data ?? []).map((row: any) => row.players).filter(Boolean) as PlayerWithStats[])
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      fetchMyPlayers(data.user.id)
    })
  }, [router, fetchMyPlayers])

  async function searchPlayers(q: string) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('players')
      .select('*, player_stats(ppg, rpg, apg, season)')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(10)
    setSearchResults((data ?? []) as PlayerWithStats[])
    setSearching(false)
  }

  useEffect(() => {
    const t = setTimeout(() => searchPlayers(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  async function addPlayer(player: PlayerWithStats) {
    if (!userId) return
    setAdding(player.id)
    const { error } = await createClient().from('agent_players').insert({ agent_id: userId, player_id: player.id })
    setAdding(null)
    if (error) { toast.error(error.message); return }
    toast.success(`${player.first_name} ${player.last_name} added to your roster.`)
    fetchMyPlayers(userId)
  }

  async function removePlayer(playerId: string) {
    if (!userId) return
    setRemoving(playerId)
    const { error } = await createClient().from('agent_players').delete().eq('agent_id', userId).eq('player_id', playerId)
    setRemoving(null)
    if (error) { toast.error(error.message); return }
    toast.success('Player removed from roster.')
    setMyPlayers(p => p.filter(x => x.id !== playerId))
  }

  const myPlayerIds = new Set(myPlayers.map(p => p.id))

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/agent" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span></span></Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Agent Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              MY <span className="text-[#C9A96E]">PLAYERS</span>
            </h1>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors">
            + ADD PLAYER
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="border border-white/5 bg-[#0d0d0d] h-40 animate-pulse" />)}
          </div>
        ) : myPlayers.length === 0 ? (
          <div className="border border-dashed border-white/10 p-20 flex flex-col items-center gap-4 text-center">
            <p className="text-gray-600 text-sm">No players on your roster yet.</p>
            <button onClick={() => setShowAddModal(true)} className="text-xs text-[#C9A96E] hover:underline">Add your first player →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myPlayers.map(player => {
              const stats = getLatestStats(player.player_stats)
              return (
                <div key={player.id} className="border border-white/10 bg-[#0d0d0d] p-5 flex gap-4 hover:border-white/20 transition-colors">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#111] border border-white/10 flex-shrink-0 flex items-center justify-center">
                    {player.photo_url
                      ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-base font-black text-[#C9A96E]">{player.first_name?.[0]}{player.last_name?.[0]}</span>
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/50">{player.first_name}</p>
                    <p className="text-base font-black text-[#C9A96E] leading-tight">{player.last_name?.toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{player.position}</p>
                    {player.height_cm && <p className="text-[10px] text-gray-600 mt-0.5">{player.height_cm}cm / {cmToFeet(player.height_cm)}</p>}
                    {player.nationality && <p className="text-[10px] text-gray-600">{getFlag(player.nationality)} {player.nationality}</p>}

                    {/* Stats */}
                    {stats && (
                      <div className="flex gap-3 mt-2 pt-2 border-t border-white/10">
                        {[['PPG', stats.ppg.toFixed(1)], ['RPG', stats.rpg.toFixed(1)], ['APG', stats.apg.toFixed(1)]].map(([l, v]) => (
                          <div key={l} className="text-center">
                            <p className="text-xs font-black text-white">{v}</p>
                            <p className="text-[8px] text-gray-600 uppercase">{l}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link href={`/players/${player.id}`} target="_blank"
                        className="text-[10px] text-[#C9A96E] hover:underline tracking-widest uppercase">
                        View Profile ↗
                      </Link>
                      <span className="text-gray-700">·</span>
                      <button onClick={() => removePlayer(player.id)} disabled={removing === player.id}
                        className="text-[10px] text-gray-600 hover:text-red-400 transition-colors tracking-widest uppercase disabled:opacity-50">
                        {removing === player.id ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Player modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">ADD PLAYER TO ROSTER</h3>
              <button onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]) }}
                className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search player by name…" autoFocus
                className="w-full bg-[#111] border border-white/10 pl-9 pr-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/50 transition-colors" />
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {searching && <p className="text-xs text-gray-600 text-center py-4">Searching…</p>}
              {!searching && searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">No players found.</p>
              )}
              {!searching && !searchQuery && (
                <p className="text-xs text-gray-600 text-center py-4">Type a name to search platform players.</p>
              )}
              {searchResults.map(player => {
                const isAdded = myPlayerIds.has(player.id)
                return (
                  <div key={player.id} className="flex items-center gap-4 p-3 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#111] flex-shrink-0 flex items-center justify-center">
                      {player.photo_url
                        ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-black text-[#C9A96E]">{player.first_name?.[0]}{player.last_name?.[0]}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{player.first_name} <span className="text-[#C9A96E]">{player.last_name?.toUpperCase()}</span></p>
                      <p className="text-[10px] text-gray-500">{player.position} {player.nationality ? `· ${getFlag(player.nationality)} ${player.nationality}` : ''}</p>
                    </div>
                    {isAdded ? (
                      <span className="text-[10px] text-[#C9A96E] tracking-widest uppercase">Added ✓</span>
                    ) : (
                      <button onClick={() => addPlayer(player)} disabled={adding === player.id}
                        className="px-3 py-1.5 border border-[#C9A96E] text-[#C9A96E] text-[10px] font-bold tracking-widest uppercase hover:bg-[#C9A96E] hover:text-black transition-all disabled:opacity-50">
                        {adding === player.id ? '…' : 'ADD'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
