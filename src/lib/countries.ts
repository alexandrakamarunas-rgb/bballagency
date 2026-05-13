export const COUNTRIES = [
  'Albania','Angola','Argentina','Australia','Austria','Belgium','Bosnia and Herzegovina',
  'Brazil','Bulgaria','Cameroon','Canada','China','Croatia','Czech Republic','Denmark',
  'Dominican Republic','Egypt','Estonia','Finland','France','Georgia','Germany','Ghana',
  'Greece','Hungary','Israel','Italy','Japan','Latvia','Lithuania','Macedonia','Mexico',
  'Montenegro','Morocco','Netherlands','New Zealand','Nigeria','Norway','Poland','Portugal',
  'Puerto Rico','Romania','Russia','Senegal','Serbia','Slovakia','Slovenia','South Korea',
  'Spain','Sweden','Switzerland','Turkey','Ukraine','United Kingdom','United States','USA',
].sort()

export const NATIONALITY_FLAGS: Record<string, string> = {
  'Albania': '🇦🇱', 'Angola': '🇦🇴', 'Argentina': '🇦🇷', 'Australia': '🇦🇺',
  'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Bosnia and Herzegovina': '🇧🇦',
  'Brazil': '🇧🇷', 'Bulgaria': '🇧🇬', 'Cameroon': '🇨🇲', 'Canada': '🇨🇦',
  'China': '🇨🇳', 'Croatia': '🇭🇷', 'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰',
  'Dominican Republic': '🇩🇴', 'Egypt': '🇪🇬', 'Estonia': '🇪🇪', 'Finland': '🇫🇮',
  'France': '🇫🇷', 'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Ghana': '🇬🇭',
  'Greece': '🇬🇷', 'Hungary': '🇭🇺', 'Israel': '🇮🇱', 'Italy': '🇮🇹',
  'Japan': '🇯🇵', 'Latvia': '🇱🇻', 'Lithuania': '🇱🇹', 'Macedonia': '🇲🇰',
  'Mexico': '🇲🇽', 'Montenegro': '🇲🇪', 'Morocco': '🇲🇦', 'Netherlands': '🇳🇱',
  'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬', 'Norway': '🇳🇴', 'Poland': '🇵🇱',
  'Portugal': '🇵🇹', 'Puerto Rico': '🇵🇷', 'Romania': '🇷🇴', 'Russia': '🇷🇺',
  'Senegal': '🇸🇳', 'Serbia': '🇷🇸', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮',
  'South Korea': '🇰🇷', 'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭',
  'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'United Kingdom': '🇬🇧',
  'United States': '🇺🇸', 'USA': '🇺🇸',
}

export function getFlag(nationality: string | null): string {
  if (!nationality) return '🏀'
  return NATIONALITY_FLAGS[nationality] ?? '🏳️'
}
