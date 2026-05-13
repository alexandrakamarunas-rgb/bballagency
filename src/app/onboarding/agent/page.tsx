'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { COUNTRIES } from '@/lib/countries'
import { LANGUAGES } from '@/lib/languages'
import { OnboardingShell, Field, Chevron, NextBtn, BackBtn, PhotoUpload, MultiSelect } from '@/app/onboarding/player/page'

const STEP_LABELS = ['Personal Info', 'Agency Info', 'About']
const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

type F = {
  first_name: string; last_name: string; phone: string; whatsapp: string
  agency_name: string; years_experience: string; countries: string[]; languages: string[]
  bio: string; photo: File | null; photoPreview: string
}

export default function AgentOnboarding() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState<F>({
    first_name: '', last_name: '', phone: '', whatsapp: '',
    agency_name: '', years_experience: '', countries: [], languages: [],
    bio: '', photo: null, photoPreview: '',
  })

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      setEmail(data.user.email ?? '')
    })
  }, [router])

  const set = <K extends keyof F>(k: K, v: F[K]) => setForm(p => ({ ...p, [k]: v }))
  const toggle = (k: 'countries' | 'languages', v: string) =>
    setForm(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }))

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

    await supabase.from('profiles').upsert({ id: userId, email: user.email ?? '', role: 'agent' }, { onConflict: 'id', ignoreDuplicates: true })

    let photo_url: string | null = null
    if (form.photo) {
      const ext = form.photo.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('agent-photos').upload(path, form.photo, { upsert: true })
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); setLoading(false); return }
      photo_url = supabase.storage.from('agent-photos').getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase.from('agents').upsert({
      id: userId,
      first_name: form.first_name || null, last_name: form.last_name || null,
      phone: form.phone || null, whatsapp: form.whatsapp || null,
      agency_name: form.agency_name || null,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      countries: form.countries.length ? form.countries : null,
      languages: form.languages.length ? form.languages : null,
      bio: form.bio || null, photo_url,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Profile complete! Welcome to BBALLAGENCY.')
    router.push('/dashboard/agent')
  }

  const titles = ['PERSONAL INFORMATION', 'AGENCY DETAILS', 'ABOUT YOU']

  return (
    <OnboardingShell step={step} steps={STEP_LABELS} title={titles[step]}>
      {/* Step 1 */}
      {step === 0 && (
        <form onSubmit={e => { e.preventDefault(); setStep(1) }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name"><input required className={inputCls} placeholder="John" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
            <Field label="Last Name"><input required className={inputCls} placeholder="Smith" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
            <Field label="Email" className="sm:col-span-2">
              <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={email} readOnly />
            </Field>
            <Field label="Phone"><input type="tel" className={inputCls} placeholder="+1 234 567 8900" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label="WhatsApp"><input type="tel" className={inputCls} placeholder="+1 234 567 8900" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Field>
          </div>
          <NextBtn />
        </form>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Agency Name" className="sm:col-span-2"><input required className={inputCls} placeholder="Elite Sports Management" value={form.agency_name} onChange={e => set('agency_name', e.target.value)} /></Field>
            <Field label="Years of Experience">
              <div className="relative">
                <select className={`${inputCls} appearance-none cursor-pointer`} value={form.years_experience} onChange={e => set('years_experience', e.target.value)}>
                  <option value="">Select…</option>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15+'].map(v => (
                    <option key={v} value={v} className="bg-[#111]">{v} {v === '1' ? 'year' : 'years'}</option>
                  ))}
                </select><Chevron />
              </div>
            </Field>
          </div>
          <MultiSelect label="Countries You Work In" options={COUNTRIES} selected={form.countries} onToggle={v => toggle('countries', v)} />
          <MultiSelect label="Languages Spoken" options={LANGUAGES} selected={form.languages} onToggle={v => toggle('languages', v)} />
          <div className="flex gap-3"><BackBtn onClick={() => setStep(0)} /><NextBtn /></div>
        </form>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <form onSubmit={handleComplete} className="space-y-6">
          <Field label="Bio / About You">
            <textarea
              className={`${inputCls} resize-none`} rows={5}
              placeholder="Tell players and clubs about your experience, specialties, and what makes your agency unique…"
              value={form.bio} onChange={e => set('bio', e.target.value)}
            />
          </Field>
          <PhotoUpload preview={form.photoPreview} fileRef={fileRef} onClick={() => fileRef.current?.click()} label="Profile Photo" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-gray-600 text-center">You can skip the photo and add it later from your dashboard.</p>
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
