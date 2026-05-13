'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { COUNTRIES } from '@/lib/countries'
import { OnboardingShell, Field, Chevron, NextBtn, BackBtn, PhotoUpload, MultiSelect } from '@/app/onboarding/player/page'

const STEP_LABELS = ['Club Info', 'League Info', 'Looking For']
const LEAGUE_LEVELS = ['Professional', 'Semi-Professional', 'Amateur']
const BUDGET_RANGES = ['Under €50K', '€50K – €100K', '€100K – €200K', '€200K – €500K', '€500K+', 'Prefer not to say']
const POSITIONS = [
  { label: 'Point Guard (PG)', value: 'PG' },
  { label: 'Shooting Guard (SG)', value: 'SG' },
  { label: 'Small Forward (SF)', value: 'SF' },
  { label: 'Power Forward (PF)', value: 'PF' },
  { label: 'Center (C)', value: 'C' },
]
const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

type F = {
  club_name: string; country: string; city: string; founded_year: string
  league_name: string; league_level: string; season: string
  open_positions: string[]; budget_range: string; requirements: string
  logo: File | null; logoPreview: string
}

export default function TeamOnboarding() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<F>({
    club_name: '', country: '', city: '', founded_year: '',
    league_name: '', league_level: '', season: '',
    open_positions: [], budget_range: '', requirements: '',
    logo: null, logoPreview: '',
  })

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  const set = <K extends keyof F>(k: K, v: F[K]) => setForm(p => ({ ...p, [k]: v }))
  const togglePos = (v: string) => setForm(p => ({
    ...p,
    open_positions: p.open_positions.includes(v) ? p.open_positions.filter(x => x !== v) : [...p.open_positions, v],
  }))

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return }
    set('logo', file); set('logoPreview', URL.createObjectURL(file))
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Session expired'); setLoading(false); return }

    await supabase.from('profiles').upsert({ id: userId, email: user.email ?? '', role: 'team' }, { onConflict: 'id', ignoreDuplicates: true })

    let logo_url: string | null = null
    if (form.logo) {
      const ext = form.logo.name.split('.').pop()
      const path = `${userId}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('team-logos').upload(path, form.logo, { upsert: true })
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); setLoading(false); return }
      logo_url = supabase.storage.from('team-logos').getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase.from('teams').upsert({
      id: userId,
      club_name: form.club_name,
      country: form.country || null, city: form.city || null,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      league_name: form.league_name || null, league_level: form.league_level || null,
      season: form.season || null,
      open_positions: form.open_positions.length ? form.open_positions : null,
      budget_range: form.budget_range || null,
      requirements: form.requirements || null,
      logo_url,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Club profile complete! Welcome to BBALLAGENCY.')
    router.push('/dashboard/team')
  }

  const titles = ['CLUB INFORMATION', 'LEAGUE DETAILS', 'LOOKING FOR PLAYERS']

  return (
    <OnboardingShell step={step} steps={STEP_LABELS} title={titles[step]}>
      {/* Step 1 */}
      {step === 0 && (
        <form onSubmit={e => { e.preventDefault(); setStep(1) }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Club Name" className="sm:col-span-2"><input required className={inputCls} placeholder="BC Real Madrid" value={form.club_name} onChange={e => set('club_name', e.target.value)} /></Field>
            <Field label="Country">
              <div className="relative">
                <select required className={`${inputCls} appearance-none cursor-pointer`} value={form.country} onChange={e => set('country', e.target.value)}>
                  <option value="" disabled>Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select><Chevron />
              </div>
            </Field>
            <Field label="City"><input required className={inputCls} placeholder="Madrid" value={form.city} onChange={e => set('city', e.target.value)} /></Field>
            <Field label="Founded Year" optional>
              <input type="number" min="1850" max={new Date().getFullYear()} className={inputCls} placeholder="1965" value={form.founded_year} onChange={e => set('founded_year', e.target.value)} />
            </Field>
          </div>
          <NextBtn />
        </form>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="League Name" className="sm:col-span-2"><input required className={inputCls} placeholder="ACB Liga" value={form.league_name} onChange={e => set('league_name', e.target.value)} /></Field>
            <Field label="League Level">
              <div className="relative">
                <select required className={`${inputCls} appearance-none cursor-pointer`} value={form.league_level} onChange={e => set('league_level', e.target.value)}>
                  <option value="" disabled>Select level</option>
                  {LEAGUE_LEVELS.map(l => <option key={l} value={l} className="bg-[#111]">{l}</option>)}
                </select><Chevron />
              </div>
            </Field>
            <Field label="Season"><input required className={inputCls} placeholder="2025-26" value={form.season} onChange={e => set('season', e.target.value)} /></Field>
          </div>
          <div className="flex gap-3"><BackBtn onClick={() => setStep(0)} /><NextBtn /></div>
        </form>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <form onSubmit={handleComplete} className="space-y-6">
          {/* Open positions */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-3">Open Positions Needed</p>
            <div className="flex flex-wrap gap-3">
              {POSITIONS.map(({ label, value }) => (
                <button key={value} type="button" onClick={() => togglePos(value)}
                  className={`px-4 py-2 border text-xs font-bold tracking-widest uppercase transition-all ${
                    form.open_positions.includes(value)
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <Field label="Budget Range" optional>
            <div className="relative">
              <select className={`${inputCls} appearance-none cursor-pointer`} value={form.budget_range} onChange={e => set('budget_range', e.target.value)}>
                <option value="">Select range</option>
                {BUDGET_RANGES.map(r => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
              </select><Chevron />
            </div>
          </Field>

          {/* Requirements */}
          <Field label="Additional Requirements" optional>
            <textarea className={`${inputCls} resize-none`} rows={4}
              placeholder="e.g. Must have EU passport, minimum 3 years pro experience, defensive specialist…"
              value={form.requirements} onChange={e => set('requirements', e.target.value)} />
          </Field>

          {/* Logo upload */}
          <PhotoUpload preview={form.logoPreview} fileRef={fileRef} onClick={() => fileRef.current?.click()} label="Club Logo" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-gray-600 text-center">You can skip the logo and add it later from your dashboard.</p>

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
