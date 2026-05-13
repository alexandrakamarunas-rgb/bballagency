/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { load } from 'cheerio'

export interface StatRow {
  season: string; team: string; league: string
  games_played: number; ppg: number; rpg: number; apg: number
  fg_pct: number; three_pct: number; ft_pct: number
}

const HEADER_MAP: Record<string, keyof StatRow> = {
  season:'season', year:'season',
  team:'team', club:'team', squad:'team',
  league:'league', competition:'league', tournament:'league',
  gp:'games_played', g:'games_played', games:'games_played', '#g':'games_played',
  ppg:'ppg', pts:'ppg', 'pts/g':'ppg', scoring:'ppg',
  rpg:'rpg', reb:'rpg', 'reb/g':'rpg', trb:'rpg',
  apg:'apg', ast:'apg', 'ast/g':'apg', assists:'apg',
  'fg%':'fg_pct', '2p%':'fg_pct', '2fg%':'fg_pct',
  '3pt%':'three_pct', '3p%':'three_pct', '3fg%':'three_pct',
  'ft%':'ft_pct', 'fta%':'ft_pct',
}

function header(raw: string): keyof StatRow | null {
  return HEADER_MAP[raw.toLowerCase().trim().replace(/\s+/g, '')] ?? null
}

function isYearLike(s: string) {
  return /^\d{2,4}[-/]\d{2,4}$/.test(s) || /^(19|20)\d{2}$/.test(s)
}

function pNum(s: string) { return parseFloat(s.replace(/[^0-9.]/g, '')) || 0 }

function pPct(s: string): number {
  const clean = s.trim().replace('%', '')
  // "made/attempted" format e.g. "20/59" → 0.339
  if (clean.includes('/')) {
    const parts = clean.split('/')
    const made = parseFloat(parts[0]) || 0
    const att  = parseFloat(parts[1]) || 0
    return att > 0 ? Math.round((made / att) * 1000) / 1000 : 0
  }
  const n = parseFloat(clean) || 0
  // percentage like "47.3" → 0.473; already-decimal "0.473" stays
  return n > 1 ? n / 100 : n
}

function tryTable($: any, table: any): StatRow[] {
  const rows: any[] = $(table).find('tr').toArray()
  if (rows.length < 2) return []

  // Find header row (first row with ≥3 recognised columns)
  let colMap: Record<number, keyof StatRow> = {}
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const m: Record<number, keyof StatRow> = {}
    $(rows[i]).find('th, td').each((j: number, c: any) => {
      const f = header($(c).text()); if (f) m[j] = f
    })
    if (Object.keys(m).length >= 3) { colMap = m; headerIdx = i; break }
  }

  const dataRows = rows.slice(headerIdx + 1)

  // Positional fallback — try Eurobasket typical order
  if (Object.keys(colMap).length < 2) {
    const sample: string[] = $(rows[headerIdx + 1] ?? rows[0]).find('td').map((_: number, c: any) => $(c).text().trim()).get()
    if (!sample.length || !isYearLike(sample[0])) return []
    colMap[0] = 'season'
    if (sample.length > 1)  colMap[1] = 'team'
    if (sample.length > 2)  colMap[2] = 'league'
    if (sample.length > 3)  colMap[3] = 'games_played'
    const hasMIN = sample.length > 10
    const off    = hasMIN ? 1 : 0
    if (sample.length > 4 + off) colMap[4 + off] = 'ppg'
    if (sample.length > 5 + off) colMap[5 + off] = 'rpg'
    if (sample.length > 6 + off) colMap[6 + off] = 'apg'
    const len = sample.length
    if (len >= 4) { colMap[len - 1] = 'ft_pct'; colMap[len - 2] = 'three_pct'; colMap[len - 3] = 'fg_pct' }
  }

  const stats: StatRow[] = []
  for (const row of dataRows) {
    const cells: string[] = $(row).find('td').map((_: number, c: any) => $(c).text().trim()).get()
    if (cells.length < 3) continue
    if (!isYearLike(cells[0] ?? '') && !(cells[0] ?? '')) continue

    const r: StatRow = { season:'', team:'', league:'', games_played:0, ppg:0, rpg:0, apg:0, fg_pct:0, three_pct:0, ft_pct:0 }
    for (const [idxStr, field] of Object.entries(colMap)) {
      const raw = cells[parseInt(idxStr)] ?? ''
      if (!raw || raw === '-' || raw === '—') continue
      if (field === 'season' || field === 'team' || field === 'league') {
        (r as any)[field] = raw
      } else if (field === 'games_played') {
        r.games_played = parseInt(raw) || 0
      } else if (field === 'fg_pct' || field === 'three_pct' || field === 'ft_pct') {
        (r as any)[field] = pPct(raw)
      } else {
        (r as any)[field] = pNum(raw)
      }
    }
    if (r.season || r.team) stats.push(r)
  }
  return stats
}

export async function POST(request: NextRequest) {
  let url: string
  try { const b = await request.json(); url = b.url?.trim() ?? '' }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  if (!url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
  if (!url.startsWith('http')) return NextResponse.json({ error: 'Enter a full URL starting with https://' }, { status: 400 })
  if (!url.includes('eurobasket.com')) return NextResponse.json({ error: 'URL must be from eurobasket.com' }, { status: 400 })

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)

  let html: string
  try {
    const res = await fetch(url, {
      signal: ctrl.signal, redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return NextResponse.json({ error: `Page not found (HTTP ${res.status}).` }, { status: 400 })
    html = await res.text()
  } catch (e: any) {
    clearTimeout(timer)
    if (e?.name === 'AbortError') return NextResponse.json({ error: 'Request timed out.' }, { status: 408 })
    return NextResponse.json({ error: 'Could not reach eurobasket.com. The site may be blocking server requests. Please add stats manually.' }, { status: 502 })
  }

  const $ = load(html)
  const playerName = $('h1').first().text().trim() || $('title').text().split(/[|–-]/)[0].trim() || undefined

  const stats: StatRow[] = []

  // Priority: Eurobasket-specific selectors
  for (const sel of ['[id*="gvStatistics"]','[id*="Statistics"]','[id*="career"]','[class*="stats"]']) {
    if (stats.length) break
    $(sel).each((_: number, el: any) => {
      if (stats.length) return
      const tbl = el.tagName === 'table' ? el : $(el).find('table').first()[0]
      if (tbl) { const r = tryTable($, tbl); if (r.length) stats.push(...r) }
    })
  }

  // Fallback: best table by row count
  if (!stats.length) {
    let best: StatRow[] = []
    $('table').each((_: number, t: any) => { const r = tryTable($, t); if (r.length > best.length) best = r })
    stats.push(...best)
  }

  if (!stats.length) {
    const bodyLen = $('body').text().trim().length
    if (bodyLen < 200) {
      return NextResponse.json({ error: 'Page appears empty or blocked. Eurobasket.com may require a real browser session. Please add stats manually.' }, { status: 422 })
    }
    return NextResponse.json({ error: 'No stats table found. The page likely loads stats via JavaScript which our scraper cannot access. Please add stats manually from the Stats section.' }, { status: 422 })
  }

  return NextResponse.json({ stats, playerName })
}
