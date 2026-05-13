import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/server'
import { getFlag } from '@/lib/countries'
import type { PlayerStats, PlayerHighlight } from '@/types'

/* ── helpers ─────────────────────────────────────────────────────────────── */

function cmToFt(cm: number) {
  const ft = Math.floor(cm / 30.48)
  const inch = Math.round((cm % 30.48) / 2.54)
  return `${ft}'${inch}"`
}
function kgToLbs(kg: number) { return Math.round(kg * 2.20462) }
function fmtPct(v: number) { return `${(v * 100).toFixed(1)}%` }
function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}
function draftYear(dob: string | null) {
  if (!dob) return '—'
  const year = new Date(dob).getFullYear() + 19
  return year <= new Date().getFullYear() ? `${year} (Eligible)` : `${year}`
}
function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return m?.[1] ?? null
}

/* ── page ────────────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: p } = await supabase.from('players').select('first_name, last_name, position, nationality').eq('id', id).single()
  if (!p) return { title: 'Player Not Found | BBALLAGENCY.COM' }
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
  return {
    title: `${name} | BBALLAGENCY.COM`,
    description: `${name} — ${p.position ?? 'Basketball Player'}${p.nationality ? ` from ${p.nationality}` : ''}. Represented by BBALLAGENCY.COM.`,
  }
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: player }, { data: stats }, { data: highlights }, { data: agentRow }] = await Promise.all([
    supabase.from('players').select('*').eq('id', id).single(),
    supabase.from('player_stats').select('*').eq('player_id', id).order('season', { ascending: false }),
    supabase.from('player_highlights').select('*').eq('player_id', id).order('created_at', { ascending: false }),
    supabase.from('agent_players').select('agents(first_name, last_name, agency_name)').eq('player_id', id).maybeSingle(),
  ])

  if (!player) notFound()

  const latestStats: PlayerStats | null = stats?.[0] ?? null
  const allStats: PlayerStats[] = stats ?? []
  const allHighlights: PlayerHighlight[] = highlights ?? []
  const agent = (agentRow as any)?.agents ?? null

  const age = player.date_of_birth ? calcAge(player.date_of_birth) : null
  const firstHighlight = allHighlights[0] ?? null
  const firstVid = firstHighlight ? ytId(firstHighlight.video_url) : null

  return (
    <>
      <Header />
      <main className="pt-16 bg-[#0a0a0a] min-h-screen">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative border-b border-white/10 overflow-hidden">
          {/* Subtle gold radial */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_50%,_#C9A96E07_0%,_transparent_70%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col-reverse lg:flex-row gap-0 lg:gap-16 items-start">

              {/* Left: info */}
              <div className="flex-1 py-10 lg:py-16 min-w-0">
                {/* Jersey number watermark */}
                <div className="text-[#C9A96E] font-black leading-none select-none mb-4 -ml-2"
                  style={{ fontSize: 'clamp(80px, 14vw, 172px)', opacity: 0.9 }}>
                  {player.jersey_number != null ? `#${player.jersey_number}` : '#—'}
                </div>

                {/* Name */}
                <h1 className="font-black tracking-tight leading-none mb-3" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
                  <span className="block text-white/60 font-normal text-2xl sm:text-3xl">{player.first_name}</span>
                  <span className="block text-white">{player.last_name?.toUpperCase()}</span>
                </h1>

                {/* Position */}
                <p className="text-[#C9A96E] text-sm sm:text-base tracking-[0.3em] uppercase font-semibold mb-8">
                  {player.position ?? 'Basketball Player'}
                </p>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-lg">
                  {/* LEFT col */}
                  <div className="space-y-4">
                    <InfoRow label="Height" value={player.height_cm ? `${player.height_cm} cm / ${cmToFt(player.height_cm)}` : '—'} />
                    <InfoRow label="Weight" value={player.weight_kg ? `${player.weight_kg} kg / ${kgToLbs(player.weight_kg)} lbs` : '—'} />
                    <InfoRow label="Born" value={player.date_of_birth ? `${player.date_of_birth}${age ? ` (${age} yrs)` : ''}` : '—'} />
                    <InfoRow label="Nationality" value={player.nationality ? `${getFlag(player.nationality)} ${player.nationality}` : '—'} />
                    <InfoRow label="Jersey" value={player.jersey_number != null ? `#${player.jersey_number}` : '—'} />
                  </div>
                  {/* RIGHT col */}
                  <div className="space-y-4">
                    <InfoRow label="Team" value={player.current_team ?? 'Free Agent'} />
                    <InfoRow label="Agency" value={agent?.agency_name ?? 'BBALLAGENCY.COM'} />
                    <InfoRow label="Position" value={player.position ?? '—'} />
                    <InfoRow label="Nationality" value={player.nationality ? `${getFlag(player.nationality)} ${player.nationality}` : '—'} />
                    <InfoRow label="NBA Draft" value={draftYear(player.date_of_birth)} />
                  </div>
                </div>
              </div>

              {/* Right: photo */}
              <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:self-stretch flex items-end">
                <div className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-full min-h-[400px] bg-gradient-to-b from-[#181818] to-[#0a0a0a] overflow-hidden">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={`${player.first_name} ${player.last_name}`}
                      className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="absolute inset-0 flex items-end justify-center pb-8">
                      <svg viewBox="0 0 100 120" className="w-48 h-56 opacity-[0.07]" fill="white">
                        <circle cx="50" cy="28" r="22" />
                        <path d="M8 120 Q8 70 50 58 Q92 70 92 120 Z" />
                      </svg>
                    </div>
                  )}
                  {/* Gold corner brackets */}
                  <div className="absolute top-5 right-5 w-10 h-10 border-t-2 border-r-2 border-[#C9A96E]/50" />
                  <div className="absolute bottom-5 left-5 w-10 h-10 border-b-2 border-l-2 border-[#C9A96E]/50" />
                  {/* Left bleed */}
                  <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent hidden lg:block" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CURRENT SEASON STATS ────────────────────────────────────── */}
        {latestStats && (
          <section className="border-b border-white/10 bg-[#080808]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
                {[
                  { label: 'PPG', val: latestStats.ppg.toFixed(1) },
                  { label: 'RPG', val: latestStats.rpg.toFixed(1) },
                  { label: 'APG', val: latestStats.apg.toFixed(1) },
                  { label: 'FG%', val: fmtPct(latestStats.fg_pct) },
                  { label: '3PT%', val: fmtPct(latestStats.three_pct) },
                  { label: 'FT%', val: fmtPct(latestStats.ft_pct) },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center border-r border-white/5 last:border-0 px-2">
                    <div className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#C9A96E] tabular-nums">{val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">
                * Stats from {latestStats.season} · {latestStats.team} · {latestStats.league} · {latestStats.games_played} GP
              </p>
            </div>
          </section>
        )}

        {/* ── CAREER STATS ────────────────────────────────────────────── */}
        {allStats.length > 0 && (
          <section className="border-b border-white/10 py-14 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-1">Performance</p>
                  <h2 className="text-3xl font-black tracking-tight">CAREER STATS</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Season','Team','League','GP','PPG','RPG','APG','FG%','3PT%','FT%'].map(h => (
                        <th key={h} className="text-left text-[9px] uppercase tracking-widest text-[#C9A96E] pb-3 pr-4 whitespace-nowrap font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allStats.map((s, i) => (
                      <tr key={s.id} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${i === 0 ? 'bg-[#C9A96E]/[0.03]' : ''}`}>
                        <td className="py-3 pr-4 font-bold text-[#C9A96E] whitespace-nowrap">{s.season}</td>
                        <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{s.team}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{s.league}</td>
                        <td className="py-3 pr-4 text-gray-400">{s.games_played}</td>
                        <td className="py-3 pr-4 font-bold text-white">{s.ppg.toFixed(1)}</td>
                        <td className="py-3 pr-4">{s.rpg.toFixed(1)}</td>
                        <td className="py-3 pr-4">{s.apg.toFixed(1)}</td>
                        <td className="py-3 pr-4">{fmtPct(s.fg_pct)}</td>
                        <td className="py-3 pr-4">{fmtPct(s.three_pct)}</td>
                        <td className="py-3 pr-4">{fmtPct(s.ft_pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── AWARDS + HIGHLIGHTS ─────────────────────────────────────── */}
        {(allHighlights.length > 0) && (
          <section className="border-b border-white/10 py-14 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Awards placeholder */}
              <div>
                <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-3">Recognition</p>
                <h2 className="text-3xl font-black tracking-tight mb-6">AWARDS</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-gray-400 text-sm">
                    <svg className="w-4 h-4 text-[#C9A96E] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Represented by BBALLAGENCY.COM
                  </div>
                  {player.current_team && (
                    <div className="flex items-start gap-3 text-gray-400 text-sm">
                      <svg className="w-4 h-4 text-[#C9A96E] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Currently playing for {player.current_team}
                    </div>
                  )}
                  {latestStats && (
                    <div className="flex items-start gap-3 text-gray-400 text-sm">
                      <svg className="w-4 h-4 text-[#C9A96E] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {latestStats.ppg.toFixed(1)} PPG in {latestStats.season} ({latestStats.league})
                    </div>
                  )}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-3">Watch</p>
                <h2 className="text-3xl font-black tracking-tight mb-6">HIGHLIGHTS</h2>
                {firstVid ? (
                  <div className="space-y-4">
                    <div className="border border-white/10 overflow-hidden">
                      <div className="aspect-video">
                        <iframe src={`https://www.youtube.com/embed/${firstVid}`}
                          className="w-full h-full" allowFullScreen title={firstHighlight?.title} />
                      </div>
                      <p className="px-4 py-3 text-sm font-semibold">{firstHighlight?.title}</p>
                    </div>
                    {allHighlights.length > 1 && (
                      <div className="grid grid-cols-2 gap-3">
                        {allHighlights.slice(1, 3).map(h => {
                          const vid = ytId(h.video_url)
                          return (
                            <a key={h.id} href={h.video_url} target="_blank" rel="noopener noreferrer"
                              className="border border-white/10 overflow-hidden group hover:border-[#C9A96E]/40 transition-colors">
                              {vid && (
                                <div className="relative aspect-video overflow-hidden">
                                  <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-[#C9A96E]/90 flex items-center justify-center">
                                      <svg className="w-3 h-3 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <p className="px-3 py-2 text-xs text-gray-400 truncate">{h.title}</p>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No highlights yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="border-b border-white/10 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-[#C9A96E]/20 p-8">
            <div>
              <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-2">Interested?</p>
              <h3 className="text-2xl font-black">CONTACT US ABOUT <span className="text-[#C9A96E]">{player.last_name?.toUpperCase()}</span></h3>
            </div>
            <div className="flex gap-3">
              <Link href="/contact" className="px-7 py-3 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors">CONTACT AGENCY</Link>
              <Link href="/players" className="px-7 py-3 border border-white/20 text-white font-bold tracking-[0.2em] uppercase text-sm hover:border-white/40 transition-colors">ALL PLAYERS</Link>
            </div>
          </div>
        </section>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────── */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#080808]">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🌍', title: 'GLOBAL EXPOSURE', desc: 'Visibility across leagues and clubs worldwide' },
              { icon: '🤝', title: 'TRUSTED NETWORK', desc: 'Direct relationships with coaches and GMs' },
              { icon: '🛡️', title: 'CAREER SUPPORT', desc: 'Contract negotiation and legal guidance' },
              { icon: '⚡', title: 'OPPORTUNITIES', desc: 'First access to the best available positions' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="text-3xl">{icon}</span>
                <p className="text-xs font-black tracking-widest uppercase text-[#C9A96E]">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
