'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface RawMessage {
  id: string
  from_id: string
  to_id: string
  subject: string | null
  body: string
  read: boolean
  created_at: string
  sender: {
    id: string
    email: string
    role: string
    agents: { first_name: string | null; last_name: string | null; agency_name: string | null }[]
    teams: { club_name: string }[]
    players: { first_name: string | null; last_name: string | null }[]
  } | null
}

function senderDisplay(sender: RawMessage['sender']): { name: string; sub: string } {
  if (!sender) return { name: 'Unknown', sub: '' }
  if (sender.role === 'agent' && sender.agents?.[0]) {
    const a = sender.agents[0]
    return {
      name: [a.first_name, a.last_name].filter(Boolean).join(' ') || sender.email,
      sub: a.agency_name ?? 'Agent',
    }
  }
  if (sender.role === 'team' && sender.teams?.[0]) {
    return { name: sender.teams[0].club_name, sub: 'Club' }
  }
  if (sender.role === 'player' && sender.players?.[0]) {
    const p = sender.players[0]
    return {
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || sender.email,
      sub: 'Player',
    }
  }
  return { name: sender.email, sub: sender.role }
}

function fmtDate(d: string) {
  const date = new Date(d)
  const diff = Date.now() - date.getTime()
  const h = diff / 3600000
  if (h < 1) return 'Just now'
  if (h < 24) return `${Math.floor(h)}h ago`
  const days = Math.floor(h / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const inputCls = 'w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

interface Props {
  userId: string
  newOfferHref?: string
  newOfferLabel?: string
}

export default function MessageInbox({ userId, newOfferHref, newOfferLabel }: Props) {
  const [messages, setMessages] = useState<RawMessage[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyTo, setReplyTo]   = useState<RawMessage | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)

  const fetchMessages = useCallback(async () => {
    const { data } = await createClient()
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_from_id_fkey(
          id, email, role,
          agents(first_name, last_name, agency_name),
          teams(club_name),
          players(first_name, last_name)
        )
      `)
      .eq('to_id', userId)
      .order('created_at', { ascending: false })
    setMessages((data ?? []) as RawMessage[])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function markRead(id: string) {
    await createClient().from('messages').update({ read: true }).eq('id', id)
    setMessages(m => m.map(x => x.id === id ? { ...x, read: true } : x))
  }

  function handleExpand(msg: RawMessage) {
    const isOpening = expanded !== msg.id
    setExpanded(isOpening ? msg.id : null)
    if (isOpening && !msg.read) markRead(msg.id)
  }

  async function sendReply() {
    if (!replyTo || !replyBody.trim()) { toast.error('Please write a reply'); return }
    setReplying(true)
    const { error } = await createClient().from('messages').insert({
      from_id: userId,
      to_id: replyTo.from_id,
      subject: `Re: ${replyTo.subject ?? '(no subject)'}`,
      body: replyBody,
    })
    setReplying(false)
    if (error) { toast.error(error.message); return }
    toast.success('Reply sent!')
    setReplyTo(null)
    setReplyBody('')
  }

  const unread = messages.filter(m => !m.read).length

  return (
    <div className="flex flex-col flex-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black">INBOX</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 bg-[#C9A96E] text-black text-[10px] font-black rounded-full">
              {unread} unread
            </span>
          )}
        </div>
        {newOfferHref && (
          <a href={newOfferHref}
            className="px-5 py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors">
            {newOfferLabel ?? 'SEND NEW MESSAGE'}
          </a>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 border border-white/5 bg-[#0d0d0d] animate-pulse" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="border border-dashed border-white/10 p-16 text-center">
          <p className="text-gray-600 text-sm">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-white/5">
          {messages.map(msg => {
            const { name, sub } = senderDisplay(msg.sender)
            const isOpen = expanded === msg.id
            return (
              <div key={msg.id} className="bg-[#0d0d0d] hover:bg-[#111] transition-colors">
                {/* Row */}
                <button
                  onClick={() => handleExpand(msg)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left"
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{ background: msg.read ? 'transparent' : '#C9A96E' }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <p className={`text-sm truncate ${msg.read ? 'text-gray-400' : 'text-white font-bold'}`}>
                        {name}
                        {sub && <span className="text-gray-500 font-normal text-xs ml-2">{sub}</span>}
                      </p>
                      <p className="text-[10px] text-gray-600 flex-shrink-0">{fmtDate(msg.created_at)}</p>
                    </div>
                    <p className={`text-xs truncate ${msg.read ? 'text-gray-600' : 'text-gray-400'}`}>
                      {msg.subject && <span className={msg.read ? '' : 'font-semibold text-gray-300'}>{msg.subject} · </span>}
                      {msg.body}
                    </p>
                  </div>

                  <svg className={`w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded body */}
                {isOpen && (
                  <div className="px-11 pb-5 space-y-4 border-t border-white/5">
                    {msg.subject && (
                      <p className="text-xs text-gray-500 pt-3">
                        <span className="text-gray-700 uppercase tracking-widest">Subject: </span>{msg.subject}
                      </p>
                    )}
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <button
                      onClick={() => { setReplyTo(msg); setReplyBody('') }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A96E] hover:text-black transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      REPLY
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reply modal */}
      {replyTo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#C9A96E] mb-1">Reply</p>
                <h3 className="text-lg font-black">TO: {senderDisplay(replyTo.sender).name.toUpperCase()}</h3>
                {replyTo.subject && <p className="text-xs text-gray-500 mt-1">Re: {replyTo.subject}</p>}
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-2">Message</label>
              <textarea required rows={5} value={replyBody} onChange={e => setReplyBody(e.target.value)}
                placeholder="Type your reply…"
                className={`${inputCls} resize-none`} />
            </div>
            <button onClick={sendReply} disabled={replying || !replyBody.trim()}
              className="w-full py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors disabled:opacity-50">
              {replying ? 'SENDING…' : 'SEND REPLY →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
