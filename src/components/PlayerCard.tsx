import Link from 'next/link'
import type { PlayerWithStats } from '@/types'
import { getFlag } from '@/lib/countries'

function cmToFeet(cm: number) {
  return `${Math.floor(cm / 30.48)}'${Math.round((cm % 30.48) / 2.54)}"`
}

export function getLatestStats(stats: PlayerWithStats['player_stats']) {
  if (!stats?.length) return null
  return [...stats].sort((a, b) => b.season.localeCompare(a.season))[0]
}

interface PlayerCardProps {
  player: PlayerWithStats
  action?: 'view' | 'contact'
  onContact?: (player: PlayerWithStats) => void
}

export default function PlayerCard({ player, action = 'view', onContact }: PlayerCardProps) {
  const stats = getLatestStats(player.player_stats)

  return (
    <div className="group flex flex-col border border-white/10 bg-[#0d0d0d] hover:border-[#C9A96E]/40 transition-[border-color] duration-200 overflow-hidden">
      {/* Photo area */}
      <div className="relative h-52 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] overflow-hidden flex items-center justify-center">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={`${player.first_name} ${player.last_name}`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <svg viewBox="0 0 100 120" className="w-24 h-28 opacity-[0.07]" fill="white">
            <circle cx="50" cy="28" r="20" />
            <path d="M10 120 Q10 72 50 62 Q90 72 90 120 Z" />
          </svg>
        )}
        {/* Jersey badge */}
        {player.jersey_number != null && (
          <div className="absolute top-3 right-3 min-w-[28px] h-7 bg-[#C9A96E] flex items-center justify-center px-1.5">
            <span className="text-[10px] font-black text-black">#{player.jersey_number}</span>
          </div>
        )}
        {/* Bottom gold bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A96E] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <div className="mb-3">
          <p className="text-xs text-white/50 leading-none mb-0.5">{player.first_name}</p>
          <p className="text-base font-black text-[#C9A96E] tracking-wide leading-none">{player.last_name?.toUpperCase()}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1.5">{player.position ?? '—'}</p>
        </div>

        <div className="space-y-1.5 text-xs text-gray-400 mb-3">
          {(player.height_cm || player.weight_kg) && (
            <p>
              {player.height_cm ? `${player.height_cm}cm / ${cmToFeet(player.height_cm)}` : ''}
              {player.height_cm && player.weight_kg ? ' · ' : ''}
              {player.weight_kg ? `${player.weight_kg}kg` : ''}
            </p>
          )}
          {player.nationality && (
            <p>{getFlag(player.nationality)} {player.nationality}</p>
          )}
          {player.current_team && (
            <p className="text-gray-600 truncate">{player.current_team}</p>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-1 mb-4 mt-auto border-t border-white/10 pt-3">
          {[
            { label: 'PPG', val: stats?.ppg?.toFixed(1) ?? '—' },
            { label: 'RPG', val: stats?.rpg?.toFixed(1) ?? '—' },
            { label: 'APG', val: stats?.apg?.toFixed(1) ?? '—' },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-black text-white">{val}</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Action button */}
        {action === 'view' ? (
          <Link
            href={`/players/${player.id}`}
            className="block w-full py-2.5 border border-[#C9A96E] text-[#C9A96E] text-xs font-bold tracking-[0.2em] uppercase text-center hover:bg-[#C9A96E] hover:text-black transition-all"
          >
            VIEW PROFILE
          </Link>
        ) : (
          <button
            onClick={() => onContact?.(player)}
            className="w-full py-2.5 bg-[#C9A96E] text-black text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#b8935a] transition-colors"
          >
            CONTACT PLAYER
          </button>
        )}
      </div>
    </div>
  )
}
