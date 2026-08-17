const footballMatchesEndpoint = '/api/football/matches/';

function normalizeFootballMatch(item, index) {
  const home = item.teama || item.team_a || item.home_team || item.teams?.home || {};
  const away = item.teamb || item.team_b || item.away_team || item.teams?.away || {};
  const homeScore = item.periods?.ft?.home ?? item.periods?.p2?.home;
  const awayScore = item.periods?.ft?.away ?? item.periods?.p2?.away;
  const status = Number(item.status);
  return {
    id: item.match_id || item.mid || `football-${index}`,
    state: status === 3 ? 'live' : status === 1 ? 'upcoming' : 'completed',
    competition: item.subtitle || item.competition?.title || 'Football match',
    teams: [
      { code: home.short_name || home.abbr || 'HOME', name: home.name || home.fullname || home.tname || 'Home team', score: (home.scores || home.score || homeScore) ?? '—', overs: '' },
      { code: away.short_name || away.abbr || 'AWAY', name: away.name || away.fullname || away.tname || 'Away team', score: (away.scores || away.score || awayScore) ?? '—', overs: '' }
    ],
    note: item.status_str || item.gamestate_str || (status === 3 ? 'Live now' : 'Match update'),
    colors: ['#1672c4', '#ef4c4c']
  };
}

export async function fetchFootballMatches() {
  const response = await fetch(`${footballMatchesEndpoint}?per_page=50&paged=1`);
  if (!response.ok) throw new Error(`Football API request failed: ${response.status}`);
  const payload = await response.json();
  const items = payload?.response?.items || payload?.items;
  if (!Array.isArray(items)) throw new Error('Football API returned no match list');
  return items.map(normalizeFootballMatch);
}
