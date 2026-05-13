'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import HeaderClient, { type UserInfo } from './HeaderClient'

export default function Header() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setUserInfo(null); return }

      const { user } = session
      const role = (user.user_metadata?.role as string) ?? 'player'

      // Display name
      let displayName = user.email?.split('@')[0] ?? 'User'
      if (role === 'player') {
        const { data: p } = await supabase.from('players').select('first_name').eq('id', user.id).maybeSingle()
        if (p?.first_name) displayName = p.first_name
      } else if (role === 'team') {
        const { data: t } = await supabase.from('teams').select('club_name').eq('id', user.id).maybeSingle()
        if (t?.club_name) displayName = t.club_name
      } else if (role === 'agent') {
        const { data: a } = await supabase.from('agents').select('first_name').eq('id', user.id).maybeSingle()
        if (a?.first_name) displayName = a.first_name
      }

      // Unread count
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('to_id', user.id)
        .eq('read', false)

      const dashboardHref =
        role === 'team'  ? '/dashboard/team'  :
        role === 'agent' ? '/dashboard/agent' :
        '/dashboard/player'

      const profileHref =
        role === 'player' ? '/dashboard/player/profile' :
        role === 'team'   ? '/onboarding/team' :
        '/onboarding/agent'

      setUserInfo({
        id:           user.id,
        email:        user.email ?? '',
        role,
        displayName,
        avatarLetter: displayName[0]?.toUpperCase() ?? 'U',
        dashboardHref,
        profileHref,
        unreadCount:  count ?? 0,
      })
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => subscription.unsubscribe()
  }, [])

  return <HeaderClient user={userInfo} />
}
