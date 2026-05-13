'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import MessageInbox from '@/components/MessageInbox'

export default function AgentMessagesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/10 bg-[#080808] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard/agent" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <Link href="/"><span className="text-base font-black tracking-widest"><span className="text-white">BBALL</span><span className="text-[#C9A96E]">AGENCY</span></span></Link>
          <span className="text-gray-600 text-sm">/ Messages</span>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col">
        <div className="mb-6">
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Agent Dashboard</p>
        </div>
        {userId
          ? <MessageInbox userId={userId} newOfferHref="/players" newOfferLabel="FIND PLAYERS" />
          : <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" /></div>
        }
      </div>
    </div>
  )
}
