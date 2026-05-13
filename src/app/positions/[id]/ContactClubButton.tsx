'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface Props {
  teamId: string
  clubName: string
  position: string
  compact?: boolean
}

const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

export default function ContactClubButton({ teamId, clubName, position, compact }: Props) {
  const [userId, setUserId]   = useState<string | null | undefined>(undefined)
  const [open, setOpen]       = useState(false)
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  async function send() {
    if (!userId || !body.trim()) return
    setSending(true)
    const { error } = await createClient().from('messages').insert({
      from_id: userId,
      to_id: teamId,
      subject: `Application — ${position} position at ${clubName}`,
      body,
    })
    setSending(false)
    if (error) { toast.error(error.message); return }
    toast.success('Message sent to the club!')
    setOpen(false)
    setBody('')
  }

  if (userId === undefined) return null

  if (!userId) {
    return (
      <Link href="/login"
        className={`inline-flex items-center justify-center gap-2 font-bold tracking-[0.2em] uppercase text-sm transition-colors ${
          compact
            ? 'w-full py-2.5 bg-[#C9A96E] text-black hover:bg-[#b8935a]'
            : 'px-8 py-3.5 bg-[#C9A96E] text-black hover:bg-[#b8935a]'
        }`}>
        LOGIN TO CONTACT
      </Link>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 font-bold tracking-[0.2em] uppercase text-sm transition-colors ${
          compact
            ? 'w-full py-2.5 bg-[#C9A96E] text-black hover:bg-[#b8935a]'
            : 'px-8 py-3.5 bg-[#C9A96E] text-black hover:bg-[#b8935a]'
        }`}>
        CONTACT CLUB →
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#C9A96E] mb-1">Apply for Position</p>
                <h3 className="text-lg font-black">{position} — {clubName.toUpperCase()}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-2">Your Message</label>
              <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)}
                placeholder={`Introduce yourself and explain why you're interested in the ${position} position at ${clubName}…`}
                className={`${inputCls} resize-none`} />
            </div>
            <button onClick={send} disabled={sending || !body.trim()}
              className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
              {sending ? 'SENDING…' : 'SEND MESSAGE →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
