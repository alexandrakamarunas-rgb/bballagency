import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/server'
import { getFlag } from '@/lib/countries'
import ContactClubButton from './ContactClubButton'

const POSITION_MAP: Record<string, string> = {
  PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward',
  PF: 'Power Forward', C: 'Center',
}

function levelBadge(level: string | null) {
  if (!level) return null
  const styles: Record<string, string> = {
    'Professional':      'border-[#C9A96E]/50 text-[#C9A96E]',
    'Semi-Professional': 'border-white/20 text-gray-400',
    'Amateur':           'border-white/10 text-gray-600',
  }
  return (
    <span className={`px-2.5 py-1 border text-[10px] font-bold tracking-widest uppercase ${styles[level] ?? 'border-white/10 text-gray-600'}`}>
      {level === 'Semi-Professional' ? 'Semi-Pro' : level}
    </span>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase.from('positions').select('position, teams(club_name)').eq('id', id).single()
  if (!data) return { title: 'Position Not Found | BBALLAGENCY.COM' }
  const team = (data as any).teams
  return {
    title: `${data.position} — ${team?.club_name ?? 'Club'} | BBALLAGENCY.COM`,
    description: `Open ${POSITION_MAP[data.position] ?? data.position} position at ${team?.club_name}. Apply via BBALLAGENCY.COM.`,
  }
}

export default async function PositionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: pos } = await supabase
    .from('positions')
    .select('*, teams(id, club_name, country, city, logo_url, league_name, league_level, season, founded_year, requirements)')
    .eq('id', id)
    .single()

  if (!pos) notFound()

  const team = (pos as any).teams

  // Other open positions from same club
  const { data: others } = await supabase
    .from('positions')
    .select('id, position, budget_range')
    .eq('team_id', pos.team_id)
    .eq('is_active', true)
    .neq('id', id)
    .limit(4)

  return (
    <>
      <Header />
      <main className="pt-16 bg-[#0a0a0a] min-h-screen">

        {/* Hero */}
        <section className="border-b border-white/10 bg-[#080808]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex flex-col sm:flex-row items-start gap-8">
              {/* Logo */}
              <div className="w-24 h-24 bg-[#111] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {team?.logo_url
                  ? <img src={team.logo_url} alt={team.club_name} className="w-full h-full object-contain p-2" />
                  : <span className="text-3xl font-black text-[#C9A96E]">{team?.club_name?.[0]}</span>
                }
              </div>

              <div className="flex-1">
                {/* Position */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[#C9A96E] font-black leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>
                    {pos.position}
                  </span>
                  <div>
                    <p className="text-white font-black text-xl leading-tight">{POSITION_MAP[pos.position] ?? pos.position}</p>
                    <p className="text-gray-500 text-sm">Open position</p>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">{team?.club_name}</h1>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {team?.country && <span className="text-sm text-gray-400">{getFlag(team.country)} {team.country}{team.city ? `, ${team.city}` : ''}</span>}
                  {team?.league_name && <span className="text-sm text-gray-500">· {team.league_name}</span>}
                  {team?.league_level && levelBadge(team.league_level)}
                  {team?.season && <span className="text-xs text-gray-600 border border-white/10 px-2 py-0.5">{team.season}</span>}
                </div>

                <ContactClubButton teamId={pos.team_id} clubName={team?.club_name ?? 'Club'} position={pos.position} />
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left: requirements */}
            <div className="lg:col-span-2 space-y-8">
              {pos.requirements && (
                <div>
                  <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-4">Requirements</p>
                  <h2 className="text-2xl font-black mb-4">ABOUT THIS POSITION</h2>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{pos.requirements}</p>
                </div>
              )}

              {/* About club */}
              <div className="border-t border-white/10 pt-8">
                <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-4">The Club</p>
                <h2 className="text-2xl font-black mb-5">ABOUT {team?.club_name?.toUpperCase()}</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {[
                    { term: 'Country', def: team?.country ? `${getFlag(team.country)} ${team.country}` : '—' },
                    { term: 'City', def: team?.city ?? '—' },
                    { term: 'League', def: team?.league_name ?? '—' },
                    { term: 'Level', def: team?.league_level ?? '—' },
                    { term: 'Season', def: team?.season ?? '—' },
                    { term: 'Founded', def: team?.founded_year?.toString() ?? '—' },
                  ].map(({ term, def }) => (
                    <div key={term}>
                      <dt className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{term}</dt>
                      <dd className="text-sm font-semibold text-white">{def}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Right: sidebar */}
            <div className="space-y-5">
              <div className="border border-white/10 bg-[#0d0d0d] p-5">
                <p className="text-[10px] tracking-widest uppercase text-[#C9A96E] mb-4">Position Details</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Position</p>
                    <p className="text-sm font-bold">{pos.position} — {POSITION_MAP[pos.position]}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Budget Range</p>
                    <p className="text-sm font-semibold">{pos.budget_range ?? 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-semibold text-green-400">Active</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Posted</p>
                    <p className="text-sm">{new Date(pos.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A96E]/20 bg-[#0d0d0d] p-5">
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Interested in this position? Contact the club directly through BBALLAGENCY.COM.
                </p>
                <ContactClubButton teamId={pos.team_id} clubName={team?.club_name ?? 'Club'} position={pos.position} compact />
              </div>
            </div>
          </div>
        </section>

        {/* Other positions */}
        {others && others.length > 0 && (
          <section className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-3">More from this club</p>
              <h2 className="text-2xl font-black mb-6">OTHER OPEN POSITIONS</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {others.map(o => (
                  <Link key={o.id} href={`/positions/${o.id}`}
                    className="border border-white/10 bg-[#0d0d0d] p-4 hover:border-[#C9A96E]/40 transition-colors">
                    <div className="text-3xl font-black text-[#C9A96E] mb-1">{o.position}</div>
                    <p className="text-xs text-gray-500">{POSITION_MAP[o.position]}</p>
                    {o.budget_range && <p className="text-[10px] text-gray-700 mt-2">{o.budget_range}</p>}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  )
}
