'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function UnreadBadge({ userId }: { userId: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    createClient()
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_id', userId)
      .eq('read', false)
      .then(({ count: c }) => setCount(c ?? 0))
  }, [userId])

  if (!count) return null
  return (
    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-[#C9A96E] text-black text-[9px] font-black rounded-full flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  )
}
