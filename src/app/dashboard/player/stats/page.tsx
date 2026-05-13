'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { PlayerStats } from '@/types'

const inputCls = 'w-full bg-[#111] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

const FIELDS = [
  { k: 'season',       label: 'Season',  ph: '2025-26',  type: 'text' },
  { k: 'team',         label: 'Team',    ph: 'Real Madrid', type: 'text' },
  { k: 'league',       label: 'League',  ph: 'ACB',      type: 'text' },
  { k: 'games_played', label: 'GP',      ph: '32',       type: 'number' },
  { k: 'ppg',          label: 'PPG',     ph: '18.5',     type: 'number' },
  { k: 'rpg',          label: 'RPG',     ph: '5.2',      type: 'number' },
  { k: 'apg',          label: 'APG',     ph: '4.1',      type: 'number' },
  { k: 'fg_pct',       label: 'FG% (e.g. 47.3)', ph: '47.3', type: 'number' },
  { k: 'three_pct',    label: '3PT% (e.g. 38.1)', ph: '38.1', type: 'number' },
  { k: 'ft_pct',       label: 'FT% (e.g. 82.0)', ph: '82.0', type: 'number' },
] as const

type FormKey = typeof FIELDS[number]['k']
type FormState = Record<FormKey, string>

const emptyForm = (): FormState => Object.fromEntries(FIELDS.map(f => [f.k, ''])) as FormState

function fmtPct(v: number) { return `${(v * 100).toFixed(1)}%` }

export default function PlayerStatsPage() {
  const router = useRouter()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [stats, setStats]       = useState<PlayerStats[]>([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState<FormState>(emptyForm())
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchStats = useCallback(async (pid: string) => {
    const { data } = await createClient().from('player_stats').select('*').eq('player_id', pid).order('season', { ascending: false })
    setStats(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setPlayerId(data.user.id)
      fetchStats(data.user.id)
    })
  }, [router, fetchStats])

  const set = (k: FormKey, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!playerId) return
    setSaving(true)
    const { error } = await createClient().from('player_stats').insert({
      player_id: playerId,
      season: form.season, team: form.team, league: form.league,
      games_played: parseInt(form.games_played),
      ppg: parseFloat(form.ppg), rpg: parseFloat(form.rpg), apg: parseFloat(form.apg),
      fg_pct:    parseFloat(form.fg_pct)    / 100,
      three_pct: parseFloat(form.three_pct) / 100,
      ft_pct:    parseFloat(form.ft_pct)    / 100,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Season added!')
    setForm(emptyForm())
    fetchStats(playerId)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await createClient().from('player_stats').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error(error.message); return }
    toast.success('Season removed.')
    setStats(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard/player" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span></span></Link>
          <span className="text-gray-600 text-sm">/ Stats</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Player Dashboard</p>
          <h1 className="text-3xl font-black">CAREER STATS</h1>
        </div>

        {/* Add form */}
        <div className="border border-white/10 bg-[#0d0d0d] p-6">
          <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-5">Add Season</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FIELDS.map(({ k, label, ph, type: ftype }) => (
                <div key={k} className={k === 'season' || k === 'team' ? 'col-span-2' : 'col-span-1'}>
                  <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{label}</label>
                  <input required type={ftype} step="any" className={inputCls} placeholder={ph}
                    value={form[k]} onChange={e => set(k as FormKey, e.target.value)} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={saving}
              className="px-8 py-3 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors disabled:opacity-50">
              {saving ? 'SAVING…' : '+ ADD SEASON'}
            </button>
          </form>
        </div>

        {/* Stats table */}
        {loading ? (
          <div className="h-32 border border-white/5 bg-[#0d0d0d] animate-pulse" />
        ) : stats.length === 0 ? (
          <div className="border border-dashed border-white/10 p-12 text-center">
            <p className="text-sm text-gray-600">No seasons added yet. Use the form above.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">{stats.length} Season{stats.length !== 1 ? 's' : ''}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Season','Team','League','GP','PPG','RPG','APG','FG%','3PT%','FT%',''].map((h, i) => (
                      <th key={i} className="text-left text-[9px] uppercase tracking-widest text-[#C9A96E] pb-3 pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                      <td className="py-3 pr-3 font-bold text-[#C9A96E] whitespace-nowrap">{s.season}</td>
                      <td className="py-3 pr-3 text-gray-300 whitespace-nowrap max-w-[120px] truncate">{s.team}</td>
                      <td className="py-3 pr-3 text-gray-500 whitespace-nowrap">{s.league}</td>
                      <td className="py-3 pr-3 text-gray-400">{s.games_played}</td>
                      <td className="py-3 pr-3 font-bold text-white">{s.ppg.toFixed(1)}</td>
                      <td className="py-3 pr-3">{s.rpg.toFixed(1)}</td>
                      <td className="py-3 pr-3">{s.apg.toFixed(1)}</td>
                      <td className="py-3 pr-3">{fmtPct(s.fg_pct)}</td>
                      <td className="py-3 pr-3">{fmtPct(s.three_pct)}</td>
                      <td className="py-3 pr-3">{fmtPct(s.ft_pct)}</td>
                      <td className="py-3">
                        <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 disabled:opacity-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
