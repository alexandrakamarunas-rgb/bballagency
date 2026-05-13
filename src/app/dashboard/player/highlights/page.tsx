'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { PlayerHighlight } from '@/types'

const inputCls = 'w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#C9A96E]/60 transition-colors'

function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return m?.[1] ?? null
}

export default function PlayerHighlightsPage() {
  const router = useRouter()
  const [playerId, setPlayerId]     = useState<string | null>(null)
  const [highlights, setHighlights] = useState<PlayerHighlight[]>([])
  const [loading, setLoading]       = useState(true)
  const [title, setTitle]           = useState('')
  const [url, setUrl]               = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const fetchHighlights = useCallback(async (pid: string) => {
    const { data } = await createClient().from('player_highlights').select('*').eq('player_id', pid).order('created_at', { ascending: false })
    setHighlights(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setPlayerId(data.user.id)
      fetchHighlights(data.user.id)
    })
  }, [router, fetchHighlights])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!playerId) return
    if (!ytId(url)) { toast.error('Please enter a valid YouTube URL'); return }
    setSaving(true)
    const { error } = await createClient().from('player_highlights').insert({ player_id: playerId, title, video_url: url })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Highlight added!')
    setTitle(''); setUrl('')
    fetchHighlights(playerId)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await createClient().from('player_highlights').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error(error.message); return }
    toast.success('Highlight removed.')
    setHighlights(h => h.filter(x => x.id !== id))
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
          <span className="text-gray-600 text-sm">/ Highlights</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Player Dashboard</p>
          <h1 className="text-3xl font-black">HIGHLIGHTS</h1>
        </div>

        {/* Add form */}
        <div className="border border-white/10 bg-[#0d0d0d] p-6">
          <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] mb-5">Add Highlight Video</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">Title</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className={inputCls}
                placeholder="Season Highlights 2025-26" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">YouTube URL</label>
              <input required type="url" value={url} onChange={e => setUrl(e.target.value)} className={inputCls}
                placeholder="https://youtube.com/watch?v=..." />
            </div>
            {url && ytId(url) && (
              <div className="border border-white/10 overflow-hidden">
                <div className="aspect-video">
                  <iframe src={`https://www.youtube.com/embed/${ytId(url)}`} className="w-full h-full" allowFullScreen title="Preview" />
                </div>
                <p className="px-4 py-2 text-xs text-[#C9A96E] tracking-widest uppercase">Preview ✓</p>
              </div>
            )}
            <button type="submit" disabled={saving}
              className="px-8 py-3 bg-[#C9A96E] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#b8935a] transition-colors disabled:opacity-50">
              {saving ? 'SAVING…' : '+ ADD HIGHLIGHT'}
            </button>
          </form>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map(i => <div key={i} className="border border-white/5 bg-[#0d0d0d] h-60 animate-pulse" />)}
          </div>
        ) : highlights.length === 0 ? (
          <div className="border border-dashed border-white/10 p-12 text-center">
            <p className="text-sm text-gray-600">No highlights yet. Add your first YouTube video above.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">{highlights.length} Video{highlights.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {highlights.map(h => {
                const vid = ytId(h.video_url)
                return (
                  <div key={h.id} className="border border-white/10 bg-[#0d0d0d] overflow-hidden group hover:border-white/20 transition-colors">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-[#111] overflow-hidden">
                      {vid ? (
                        <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt={h.title}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      {/* Play overlay */}
                      <a href={h.video_url} target="_blank" rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#C9A96E] flex items-center justify-center">
                          <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </a>
                    </div>

                    {/* Info bar */}
                    <div className="flex items-center justify-between px-4 py-3 gap-3">
                      <p className="text-sm font-semibold truncate">{h.title}</p>
                      <button onClick={() => handleDelete(h.id)} disabled={deleting === h.id}
                        className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50">
                        {deleting === h.id ? (
                          <div className="w-4 h-4 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
