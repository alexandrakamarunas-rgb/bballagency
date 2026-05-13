export type Role = 'player' | 'team' | 'agent'

export interface Profile {
  id: string
  email: string
  role: Role
  created_at: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  position: string | null
  height_cm: number | null
  weight_kg: number | null
  date_of_birth: string | null
  nationality: string | null
  jersey_number: number | null
  current_team: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface PlayerWithProfile extends Player {
  profiles: Profile
}

export interface PlayerStats {
  id: string
  player_id: string
  season: string
  team: string
  league: string
  games_played: number
  ppg: number
  rpg: number
  apg: number
  fg_pct: number
  three_pct: number
  ft_pct: number
}

export interface PlayerHighlight {
  id: string
  player_id: string
  title: string
  video_url: string
  created_at: string
}

export interface PlayerWithStats extends Player {
  player_stats: PlayerStats[]
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  subject: string | null
  body: string
  read: boolean
  created_at: string
}

export interface AgentPlayer {
  id: string
  agent_id: string
  player_id: string
  created_at: string
  players?: PlayerWithStats
}

export interface Position {
  id: string
  team_id: string
  position: string
  budget_range: string | null
  requirements: string | null
  is_active: boolean
  created_at: string
}

export interface PositionWithTeam extends Position {
  teams: {
    id: string
    club_name: string
    country: string | null
    city: string | null
    logo_url: string | null
    league_name: string | null
    league_level: string | null
    season: string | null
  } | null
}

export interface Agent {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  whatsapp: string | null
  agency_name: string | null
  years_experience: number | null
  countries: string[] | null
  languages: string[] | null
  bio: string | null
  photo_url: string | null
  created_at: string
}

export interface Team {
  id: string
  club_name: string
  country: string | null
  city: string | null
  founded_year: number | null
  league_name: string | null
  league_level: string | null
  season: string | null
  open_positions: string[] | null
  budget_range: string | null
  requirements: string | null
  logo_url: string | null
  created_at: string
}
