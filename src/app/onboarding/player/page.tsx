'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { COUNTRIES } from '@/lib/countries'

const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center']
const STEP_LABELS = ['Basic Info', 'Basketball', 'Photo']
const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'
const selectCls = `${inputCls} appearance-none cursor-pointer`

type F = { first_name: string; last_name: string; date_of_birth: string; nationality: string; position: string; height_cm: string; weight_kg: string; jersey_number: string; current_team: string; photo: File | null; photoPreview: string }

export default function PlayerOnboarding() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<F>({ first_name: '', last_name: '', date_of_birth: '', nationality: '', position: '', height_cm: '', weight_kg: '', jersey_number: '', current_team: '', photo: null, photoPreview: '' })

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  const set = <K extends keyof F>(k: K, v: F[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    set('photo', file); set('photoPreview', URL.createObjectURL(file))
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Session expired'); setLoading(false); return }

    await supabase.from('profiles').upsert({ id: userId, email: user.email ?? '', role: 'player' }, { onConflict: 'id', ignoreDuplicates: true })

    let photo_url: string | null = null
    if (form.photo) {
      const ext = form.photo.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(path, form.photo, { upsert: true })
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); setLoading(false); return }
      photo_url = supabase.storage.from('player-photos').getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase.from('players').upsert({
      id: userId, first_name: form.first_name, last_name: form.last_name,
      date_of_birth: form.date_of_birth || null, nationality: form.nationality || null,
      position: form.position || null,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      current_team: form.current_team || null, photo_url,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Profile complete! Welcome to BBALLAGENCY.')
    router.push('/dashboard/player')
  }

  return (
    <OnboardingShell step={step} steps={STEP_LABELS} title={['BASIC INFORMATION', 'BASKETBALL PROFILE', 'PROFILE PHOTO'][step]}>
      {step === 0 && (
        <form onSubmit={e => { e.preventDefault(); setStep(1) }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name"><input required className={inputCls} placeholder="Marcus" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
            <Field label="Last Name"><input required className={inputCls} placeholder="Johnson" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
            <Field label="Date of Birth"><input required type="date" className={`${inputCls} [color-scheme:dark]`} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Field>
            <Field label="Nationality">
              <div className="relative">
                <select required className={selectCls} value={form.nationality} onChange={e => set('nationality', e.target.value)}>
                  <option value="" disabled>Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select><Chevron />
              </div>
            </Field>
          </div>
          <NextBtn />
        </form>
      )}
      {step === 1 && (
        <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Position">
              <div className="relative">
                <select required className={selectCls} value={form.position} onChange={e => set('position', e.target.value)}>
                  <option value="" disabled>Select position</option>
                  {POSITIONS.map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
                </select><Chevron />
              </div>
            </Field>
            <Field label="Jersey Number"><input required type="number" min="0" max="99" className={inputCls} placeholder="23" value={form.jersey_number} onChange={e => set('jersey_number', e.target.value)} /></Field>
            <Field label="Height (cm)"><input required type="number" min="150" max="230" className={inputCls} placeholder="193" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} /></Field>
            <Field label="Weight (kg)"><input required type="number" min="50" max="200" className={inputCls} placeholder="90" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} /></Field>
            <Field label="Current Team" optional className="sm:col-span-2"><input className={inputCls} placeholder="e.g. Real Madrid Basketball" value={form.current_team} onChange={e => set('current_team', e.target.value)} /></Field>
          </div>
          <div className="flex gap-3"><BackBtn onClick={() => setStep(0)} /><NextBtn /></div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleComplete} className="space-y-6">
          <PhotoUpload preview={form.photoPreview} fileRef={fileRef} onClick={() => fileRef.current?.click()} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-gray-600 text-center">You can skip this and add a photo later.</p>
          <div className="flex gap-3">
            <BackBtn onClick={() => setStep(1)} />
            <button type="submit" disabled={loading} className="flex-1 py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
              {loading ? 'SAVING…' : 'COMPLETE PROFILE'}
            </button>
          </div>
        </form>
      )}
    </OnboardingShell>
  )
}

// ── Shared UI helpers ────────────────────────────────────────────────────────

export function OnboardingShell({ step, steps, title, children }: { step: number; steps: string[]; title: string; children: React.ReactNode }) {
  const pct = Math.round(((step + 1) / steps.length) * 100)
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-10 px-4">
      <div className="max-w-2xl mx-auto mb-8">
        <Link href="/"><span className="text-lg font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span><span className="text-white/50">.com</span></span></Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${i <= step ? 'bg-[#C9A96E] border-[#C9A96E] text-black' : 'border-white/20 text-gray-600'}`}>{i + 1}</div>
                <span className={`text-xs uppercase tracking-wider hidden sm:block ${i <= step ? 'text-[#C9A96E]' : 'text-gray-600'}`}>{label}</span>
                {i < steps.length - 1 && <div className={`hidden sm:block h-px w-12 mx-1 ${i < step ? 'bg-[#C9A96E]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
          <div className="h-0.5 bg-white/10 rounded-full"><div className="h-full bg-[#C9A96E] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="mb-8">
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Step {step + 1} of {steps.length}</p>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, optional, className }: { label: string; children: React.ReactNode; optional?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] tracking-widest uppercase text-gray-500 mb-2">
        {label}{optional && <span className="text-gray-700 normal-case ml-1">(optional)</span>}
      </label>
      {children}
    </div>
  )
}

export function Chevron() {
  return <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
}

export function NextBtn({ label = 'NEXT →' }: { label?: string }) {
  return <button type="submit" className="flex-1 py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors">{label}</button>
}

export function BackBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="px-6 py-3 border border-white/10 text-sm font-bold tracking-widest uppercase text-gray-400 hover:border-white/20 hover:text-white transition-colors">BACK</button>
}

export function PhotoUpload({ preview, fileRef, onClick, label = 'Profile Photo' }: { preview: string; fileRef: React.RefObject<HTMLInputElement | null>; onClick: () => void; label?: string }) {
  return (
    <div onClick={onClick} className="border-2 border-dashed border-white/10 hover:border-[#C9A96E]/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 p-10">
      {preview ? (
        <><img src={preview} alt="Preview" className="w-36 h-36 object-cover rounded-full" /><p className="text-xs text-[#C9A96E]">Click to change</p></>
      ) : (
        <><div className="w-20 h-20 rounded-full bg-[#111] border border-white/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <div className="text-center"><p className="text-sm font-semibold text-white mb-1">Click to upload {label}</p><p className="text-xs text-gray-600">JPG, PNG or WebP · Max 5MB</p></div></>
      )}
    </div>
  )
}

export function MultiSelect({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">{label}</p>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(s => (
            <button key={s} type="button" onClick={() => onToggle(s)} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C9A96E]/10 border border-[#C9A96E]/40 text-[#C9A96E] text-xs font-semibold hover:bg-[#C9A96E]/20 transition-colors">
              {s} <span className="opacity-60">×</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.filter(o => !selected.includes(o)).map(o => (
          <button key={o} type="button" onClick={() => onToggle(o)} className="px-3 py-1.5 border border-white/10 text-gray-400 text-xs hover:border-[#C9A96E]/30 hover:text-white transition-colors">
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
