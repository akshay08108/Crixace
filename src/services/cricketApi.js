const matchesEndpoint = '/api/sportmonks/api/v2.0/fixtures?include=localteam,visitorteam,league,scoreboards';

function normalizeMatch(item, index) {
  const teams = [item.localteam || item.teama, item.visitorteam || item.teamb];
  const titleParts = String(item.name || item.title || item.short_title || 'Cricket match').split(/\s+vs\s+/i);
  const state = item.status === 'live' || item.live === true ? 'live' : item.status === 1 ? 'upcoming' : 'completed';
  return {
    id: item.match_id || item.mid || `entity-${index}`,
    state,
    competition: item.league?.name || item.season?.name || item.subtitle || item.venue?.name || item.match_number || 'Live cricket',
    teams: teams.map((team, teamIndex) => ({
      code: team?.code || team?.short_name || team?.abbr || titleParts[teamIndex]?.slice(0, 3).toUpperCase() || 'TBD',
      name: team?.name || team?.fullname || titleParts[teamIndex] || 'Team',
      score: team?.scores || team?.score || team?.runs || item.scoreboards?.[teamIndex]?.total || '—',
      overs: team?.overs || ''
    })),
    note: state === 'live' ? item.status_str || 'Live now' : item.status_str || item.note || (state === 'upcoming' ? 'Upcoming match' : 'Match completed'),
    colors: ['#168653', '#1c72c4']
  };
}

export async function fetchEntitySportMatches() {
  const response = await fetch(`${matchesEndpoint}&per_page=50&paged=1`);
  if (!response.ok) throw new Error(`EntitySport request failed: ${response.status}`);
  const payload = await response.json();
  const items = payload?.data || payload?.response?.items;
  if (!Array.isArray(items)) throw new Error('EntitySport returned no match list');
  return items.map(normalizeMatch);
}
