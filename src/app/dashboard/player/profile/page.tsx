'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { COUNTRIES } from '@/lib/countries'
import type { Player } from '@/types'

const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center']
const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'
const selectCls = `${inputCls} appearance-none cursor-pointer`

type FormState = {
  first_name: string; last_name: string; date_of_birth: string; nationality: string
  position: string; height_cm: string; weight_kg: string; jersey_number: string; current_team: string
  photo: File | null; photoPreview: string
}

export default function PlayerProfileEditPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({
    first_name: '', last_name: '', date_of_birth: '', nationality: '',
    position: '', height_cm: '', weight_kg: '', jersey_number: '', current_team: '',
    photo: null, photoPreview: '',
  })

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      const { data: player } = await createClient().from('players').select('*').eq('id', data.user.id).single()
      if (player) {
        setForm(f => ({
          ...f,
          first_name:    player.first_name ?? '',
          last_name:     player.last_name ?? '',
          date_of_birth: player.date_of_birth ?? '',
          nationality:   player.nationality ?? '',
          position:      player.position ?? '',
          height_cm:     player.height_cm?.toString() ?? '',
          weight_kg:     player.weight_kg?.toString() ?? '',
          jersey_number: player.jersey_number?.toString() ?? '',
          current_team:  player.current_team ?? '',
          photoPreview:  player.photo_url ?? '',
        }))
      }
      setLoading(false)
    })
  }, [router])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    set('photo', file)
    set('photoPreview', URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    const supabase = createClient()

    let photo_url: string | undefined
    if (form.photo) {
      const ext = form.photo.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(path, form.photo, { upsert: true })
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); setSaving(false); return }
      photo_url = supabase.storage.from('player-photos').getPublicUrl(path).data.publicUrl
    }

    const payload: Partial<Player> = {
      first_name:    form.first_name || undefined,
      last_name:     form.last_name || undefined,
      date_of_birth: form.date_of_birth || null,
      nationality:   form.nationality || null,
      position:      form.position || null,
      height_cm:     form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg:     form.weight_kg ? parseInt(form.weight_kg) : null,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      current_team:  form.current_team || null,
      ...(photo_url !== undefined ? { photo_url } : {}),
    }

    const { error } = await supabase.from('players').update(payload).eq('id', userId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated!')
    router.push('/dashboard/player')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard/player" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span></span></Link>
          <span className="text-gray-600 text-sm">/ Edit Profile</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Player Dashboard</p>
          <h1 className="text-3xl font-black">EDIT PROFILE</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Photo */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">Profile Photo</p>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#111] border border-white/10 flex-shrink-0 flex items-center justify-center">
                {form.photoPreview ? (
                  <img src={form.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-[#C9A96E]">{form.first_name?.[0]}{form.last_name?.[0]}</span>
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-5 py-2.5 border border-white/20 text-xs font-bold tracking-widest uppercase text-gray-400 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all">
                  {form.photoPreview ? 'CHANGE PHOTO' : 'UPLOAD PHOTO'}
                </button>
                <p className="text-xs text-gray-600 mt-2">JPG, PNG or WebP · Max 5MB</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Personal */}
          <section>
            <h2 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-4 pb-3 border-b border-white/10">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name"><input className={inputCls} placeholder="Marcus" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
              <Field label="Last Name"><input className={inputCls} placeholder="Johnson" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
              <Field label="Date of Birth"><input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Field>
              <Field label="Nationality">
                <div className="relative">
                  <select className={selectCls} value={form.nationality} onChange={e => set('nationality', e.target.value)}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  </select>
                  <Chevron />
                </div>
              </Field>
            </div>
          </section>

          {/* Basketball */}
          <section>
            <h2 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-4 pb-3 border-b border-white/10">Basketball Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Position">
                <div className="relative">
                  <select className={selectCls} value={form.position} onChange={e => set('position', e.target.value)}>
                    <option value="">Select position</option>
                    {POSITIONS.map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
                  </select>
                  <Chevron />
                </div>
              </Field>
              <Field label="Jersey Number"><input type="number" min="0" max="99" className={inputCls} placeholder="23" value={form.jersey_number} onChange={e => set('jersey_number', e.target.value)} /></Field>
              <Field label="Height (cm)"><input type="number" min="150" max="230" className={inputCls} placeholder="193" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} /></Field>
              <Field label="Weight (kg)"><input type="number" min="50" max="200" className={inputCls} placeholder="90" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} /></Field>
              <Field label="Current Team" className="sm:col-span-2" optional>
                <input className={inputCls} placeholder="e.g. Real Madrid Basketball" value={form.current_team} onChange={e => set('current_team', e.target.value)} />
              </Field>
            </div>
          </section>

          <button type="submit" disabled={saving}
            className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
            {saving ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, optional, className }: { label: string; children: React.ReactNode; optional?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] tracking-widest uppercase text-gray-500 mb-2">
        {label}{optional && <span className="text-gray-700 normal-case ml-1">(optional)</span>}
      </label>
      {children}
    </div>
  )
}
function Chevron() {
  return <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
}
