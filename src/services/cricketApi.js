const matchesEndpoint = '/api/cricket?offset=0';

function normalizeMatch(item, index) {
  const teams = Array.isArray(item.teams) ? item.teams : [];
  const teamInfo = Array.isArray(item.teamInfo) ? item.teamInfo : [];
  const innings = Array.isArray(item.score) ? item.score : [];
  const state = item.matchEnded ? 'completed' : item.matchStarted ? 'live' : 'upcoming';

  const normalizedTeams = teams.slice(0, 2).map((teamName, teamIndex) => {
    const info = teamInfo.find(team => team.name === teamName) || teamInfo[teamIndex] || {};
    const teamInnings = innings.filter(entry => String(entry.inning || '').toLowerCase().startsWith(String(teamName).toLowerCase()));
    const latestInnings = teamInnings[teamInnings.length - 1];
    const score = latestInnings
      ? `${latestInnings.r ?? 0}${latestInnings.w == null ? '' : `/${latestInnings.w}`}`
      : '—';

    return {
      code: info.shortname || String(teamName).slice(0, 3).toUpperCase() || 'TBD',
      name: info.name || teamName || 'Team',
      score,
      overs: latestInnings?.o == null ? '' : String(latestInnings.o)
    };
  });

  while (normalizedTeams.length < 2) {
    normalizedTeams.push({ code: 'TBD', name: 'Team', score: '—', overs: '' });
  }

  return {
    id: item.id || `cricketdata-${index}`,
    state,
    competition: [item.matchType?.toUpperCase(), item.venue].filter(Boolean).join(' · ') || 'Cricket match',
    teams: normalizedTeams,
    note: item.status || (state === 'live' ? 'Live now' : state === 'upcoming' ? 'Upcoming match' : 'Match completed'),
    colors: ['#168653', '#1c72c4']
  };
}

export async function fetchCricketMatches() {
  const response = await fetch(matchesEndpoint);
  if (!response.ok) throw new Error(`Cricket Data request failed: ${response.status}`);
  const payload = await response.json();
  const items = payload?.data;
  if (!Array.isArray(items)) throw new Error('Cricket Data returned no match list');
  return items.map(normalizeMatch);
}
