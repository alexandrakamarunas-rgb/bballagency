'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { Position } from '@/types'

const POSITION_OPTS = [
  { code: 'PG', label: 'Point Guard' },
  { code: 'SG', label: 'Shooting Guard' },
  { code: 'SF', label: 'Small Forward' },
  { code: 'PF', label: 'Power Forward' },
  { code: 'C',  label: 'Center' },
]
const BUDGET_OPTS = ['Under €50K', '€50K – €100K', '€100K – €200K', '€200K – €500K', '€500K+', 'Prefer not to say']

const POSITION_MAP: Record<string, string> = Object.fromEntries(POSITION_OPTS.map(p => [p.code, p.label]))

const inputCls = 'w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

type FormState = { position: string; budget_range: string; requirements: string; is_active: boolean }
const empty = (): FormState => ({ position: '', budget_range: '', requirements: '', is_active: true })

export default function TeamPositionsPage() {
  const router = useRouter()
  const [teamId, setTeamId]         = useState<string | null>(null)
  const [positions, setPositions]   = useState<Position[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Position | null>(null)
  const [form, setForm]             = useState<FormState>(empty())
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const fetchPositions = useCallback(async (tid: string) => {
    const { data } = await createClient().from('positions').select('*').eq('team_id', tid).order('created_at', { ascending: false })
    setPositions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setTeamId(data.user.id)
      fetchPositions(data.user.id)
    })
  }, [router, fetchPositions])

  function openAdd() { setEditing(null); setForm(empty()); setShowModal(true) }
  function openEdit(p: Position) { setEditing(p); setForm({ position: p.position, budget_range: p.budget_range ?? '', requirements: p.requirements ?? '', is_active: p.is_active }); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null); setForm(empty()) }
  const set = (k: keyof FormState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!teamId || !form.position) { toast.error('Select a position'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      team_id: teamId,
      position: form.position,
      budget_range: form.budget_range || null,
      requirements: form.requirements || null,
      is_active: form.is_active,
    }
    const { error } = editing
      ? await supabase.from('positions').update(payload).eq('id', editing.id)
      : await supabase.from('positions').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Position updated!' : 'Position added!')
    closeModal()
    fetchPositions(teamId)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await createClient().from('positions').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error(error.message); return }
    toast.success('Position removed.')
    setPositions(p => p.filter(x => x.id !== id))
  }

  async function toggleActive(pos: Position) {
    const { error } = await createClient().from('positions').update({ is_active: !pos.is_active }).eq('id', pos.id)
    if (error) { toast.error(error.message); return }
    setPositions(p => p.map(x => x.id === pos.id ? { ...x, is_active: !x.is_active } : x))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard/team" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span></span></Link>
          <span className="text-gray-600 text-sm">/ Open Positions</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Team Dashboard</p>
            <h1 className="text-3xl font-black">OPEN POSITIONS</h1>
          </div>
          <button onClick={openAdd}
            className="px-5 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors">
            + ADD POSITION
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 border border-white/5 bg-[#0d0d0d] animate-pulse" />)}
          </div>
        ) : positions.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 flex flex-col items-center gap-4 text-center">
            <p className="text-gray-600 text-sm">No open positions yet.</p>
            <button onClick={openAdd} className="text-xs text-[#C9A96E] hover:underline">Add your first position →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map(pos => (
              <div key={pos.id} className={`border bg-[#0d0d0d] p-5 flex items-start gap-5 transition-colors ${pos.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                {/* Position abbr */}
                <div className="text-4xl font-black text-[#C9A96E] leading-none flex-shrink-0 w-12">{pos.position}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-white">{POSITION_MAP[pos.position]}</p>
                    <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${pos.is_active ? 'border-green-500/30 text-green-400' : 'border-white/10 text-gray-600'}`}>
                      {pos.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {pos.budget_range && <p className="text-xs text-gray-500 mb-1">Budget: {pos.budget_range}</p>}
                  {pos.requirements && <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{pos.requirements}</p>}
                  <p className="text-[10px] text-gray-700 mt-2">{new Date(pos.created_at).toLocaleDateString()}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(pos)} title={pos.is_active ? 'Deactivate' : 'Activate'}
                    className={`p-2 transition-colors ${pos.is_active ? 'text-green-500 hover:text-green-400' : 'text-gray-600 hover:text-green-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pos.is_active ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </button>
                  <button onClick={() => openEdit(pos)} className="p-2 text-gray-500 hover:text-[#C9A96E] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(pos.id)} disabled={deleting === pos.id} className="p-2 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50">
                    {deleting === pos.id
                      ? <div className="w-4 h-4 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#C9A96E] mb-1">{editing ? 'Edit' : 'New'} Position</p>
                <h3 className="text-xl font-black">{editing ? 'UPDATE POSITION' : 'ADD POSITION'}</h3>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-2">Position *</label>
                <div className="grid grid-cols-5 gap-2">
                  {POSITION_OPTS.map(({ code, label }) => (
                    <button key={code} type="button" onClick={() => set('position', code)}
                      className={`py-2.5 flex flex-col items-center gap-1 border text-xs font-bold transition-all ${form.position === code ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>
                      <span className="text-base font-black">{code}</span>
                      <span className="text-[8px] text-center leading-tight hidden sm:block">{label.split(' ').slice(-1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-2">Budget Range</label>
                <div className="relative">
                  <select value={form.budget_range} onChange={e => set('budget_range', e.target.value)} className={`${inputCls} appearance-none`}>
                    <option value="">Not specified</option>
                    {BUDGET_OPTS.map(b => <option key={b} value={b} className="bg-[#111]">{b}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-2">Requirements</label>
                <textarea rows={4} value={form.requirements} onChange={e => set('requirements', e.target.value)}
                  placeholder="e.g. EU passport required, min. 3 years pro experience, defensive specialist…"
                  className={`${inputCls} resize-none`} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => set('is_active', !form.is_active)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_active ? 'bg-green-600' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-400">Position is active</span>
              </label>

              <button type="submit" disabled={saving || !form.position}
                className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
                {saving ? 'SAVING…' : editing ? 'UPDATE POSITION' : 'ADD POSITION'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
