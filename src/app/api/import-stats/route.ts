import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export interface StatRow {
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

// Normalise a header cell to a known key
const HEADER_MAP: Record<string, keyof StatRow> = {
  season: 'season', year: 'season',
  team: 'team', club: 'team', squad: 'team',
  league: 'league', competition: 'league', tournament: 'league', conf: 'league',
  gp: 'games_played', g: 'games_played', games: 'games_played', played: 'games_played',
  ppg: 'ppg', pts: 'ppg', 'pts/g': 'ppg', scoring: 'ppg',
  rpg: 'rpg', reb: 'rpg', 'reb/g': 'rpg', rebounds: 'rpg', trb: 'rpg',
  apg: 'apg', ast: 'apg', 'ast/g': 'apg', assists: 'apg',
  'fg%': 'fg_pct', '2fg%': 'fg_pct', 'fgm%': 'fg_pct', '2p%': 'fg_pct',
  '3pt%': 'three_pct', '3p%': 'three_pct', '3fg%': 'three_pct', 'tp%': 'three_pct',
  'ft%': 'ft_pct', 'fta%': 'ft_pct',
}

function resolveHeader(raw: string): keyof StatRow | null {
  const key = raw.toLowerCase().trim().replace(/\s+/g, '')
  return HEADER_MAP[key] ?? null
}

function parseNum(raw: string): number {
  if (!raw) return 0
  const cleaned = raw.replace('%', '').trim()
  return parseFloat(cleaned) || 0
}

function parsePct(raw: string): number {
  const n = parseNum(raw)
  // Values like "47.3" → 0.473, already-decimal "0.473" stays
  return n > 1 ? n / 100 : n
}

function looksLikeSeasonRow(cells: string[]): boolean {
  return cells.some(c => /^\d{2,4}/.test(c.trim()))
}

export async function POST(request: NextRequest) {
  let url: string
  try {
    const body = await request.json()
    url = body.url?.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Validate URL
  if (!url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
  if (!url.startsWith('http')) return NextResponse.json({ error: 'Enter a full URL starting with https://' }, { status: 400 })

  let parsedUrl: URL
  try { parsedUrl = new URL(url) }
  catch { return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 }) }

  if (!parsedUrl.hostname.includes('eurobasket.com')) {
    return NextResponse.json({ error: 'URL must be from eurobasket.com' }, { status: 400 })
  }

  // Fetch page
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  let html: string
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.eurobasket.com/',
      },
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return NextResponse.json({ error: `Player page not found (HTTP ${res.status}). Check the URL and try again.` }, { status: 400 })
    }
    html = await res.text()
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. The page took too long to load.' }, { status: 408 })
    }
    return NextResponse.json({ error: 'Could not reach eurobasket.com. Please add stats manually.' }, { status: 502 })
  }

  // Parse HTML
  const $ = cheerio.load(html)

  // Extract player name (best-effort)
  const playerName =
    $('h1').first().text().trim() ||
    $('title').text().split('|')[0].trim() ||
    undefined

  const stats: StatRow[] = []

  // Scan every table looking for one with basketball stats headers
  $('table').each((_, table) => {
    if (stats.length > 0) return // stop once we found a stats table

    // Build header map: column index → field name
    const colMap: Record<number, keyof StatRow> = {}
    const headerRow = $(table).find('thead tr, tr').first()

    $(headerRow).find('th, td').each((idx, th) => {
      const field = resolveHeader($(th).text())
      if (field) colMap[idx] = field
    })

    // Must have at minimum season + one stat column to qualify
    const fields = Object.values(colMap)
    if (!fields.includes('season') && !fields.includes('games_played')) return
    if (fields.length < 4) return

    // Parse data rows
    $(table).find('tbody tr, tr').each((_, tr) => {
      const cells = $(tr).find('td')
      if (cells.length < 4) return

      const cellTexts = cells.map((_, td) => $(td).text().trim()).get()
      if (!looksLikeSeasonRow(cellTexts)) return

      const row: Partial<StatRow> = {}
      Object.entries(colMap).forEach(([idx, field]) => {
        const raw = cellTexts[parseInt(idx)] ?? ''
        if (!raw || raw === '-' || raw === '—') return

        if (field === 'season' || field === 'team' || field === 'league') {
          ;(row as Record<string, string | number>)[field] = raw
        } else if (field === 'games_played') {
          row.games_played = parseInt(raw) || 0
        } else if (field === 'fg_pct' || field === 'three_pct' || field === 'ft_pct') {
          ;(row as Record<string, number>)[field] = parsePct(raw)
        } else {
          ;(row as Record<string, number>)[field] = parseNum(raw)
        }
      })

      if (row.season || row.team) {
        stats.push({
          season:       row.season      ?? '',
          team:         row.team        ?? '',
          league:       row.league      ?? '',
          games_played: row.games_played ?? 0,
          ppg:          row.ppg         ?? 0,
          rpg:          row.rpg         ?? 0,
          apg:          row.apg         ?? 0,
          fg_pct:       row.fg_pct      ?? 0,
          three_pct:    row.three_pct   ?? 0,
          ft_pct:       row.ft_pct      ?? 0,
        })
      }
    })
  })

  if (stats.length === 0) {
    return NextResponse.json({
      error: 'No career stats table found on this page. The page may use JavaScript rendering or the structure has changed. Please add stats manually.',
    }, { status: 422 })
  }

  return NextResponse.json({ stats, playerName })
}
