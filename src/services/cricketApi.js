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

function oversToBalls(overs) {
  const [completedOvers, balls = '0'] = String(overs ?? 0).split('.');
  return (Number(completedOvers) * 6) + Number(balls);
}

export async function fetchMatchScorecard(matchId) {
  const response = await fetch(`/api/scorecard?id=${encodeURIComponent(matchId)}`);
  if (!response.ok) throw new Error(`Scorecard request failed: ${response.status}`);
  const payload = await response.json();
  const innings = payload?.data?.scorecard;
  if (!Array.isArray(innings) || !innings.length) throw new Error('No scorecard is available');

  const currentInnings = innings[innings.length - 1];
  const inningsScores = Array.isArray(payload?.data?.score) ? payload.data.score : [];
  const currentInningsScore = inningsScores.find(score => score.inning === currentInnings.inning) || inningsScores[inningsScores.length - 1];
  const inningsOvers = currentInningsScore?.o ?? 0;
  const batting = Array.isArray(currentInnings.batting) ? currentInnings.batting : [];
  const bowling = Array.isArray(currentInnings.bowling) ? currentInnings.bowling : [];
  const activeBatters = batting.filter(player => String(player['dismissal-text']).toLowerCase() === 'not out').slice(-2);
  const partialOverBowlers = bowling.filter(player => String(player.o ?? '').includes('.') && Number(String(player.o).split('.')[1]) > 0);
  const currentBowler = partialOverBowlers[partialOverBowlers.length - 1] || null;

  return {
    inning: currentInnings.inning || 'Current innings',
    batters: activeBatters.map(player => ({
      name: player.batsman?.name || 'Batter',
      runs: player.r ?? 0,
      balls: player.b ?? 0
    })),
    bowler: currentBowler ? {
      name: currentBowler.bowler?.name || 'Bowler',
      overs: currentBowler.o ?? 0,
      balls: oversToBalls(currentBowler.o),
      currentOver: Math.floor(Number(inningsOvers)) + 1,
      ballsInCurrentOver: Number(String(inningsOvers).split('.')[1] || 0),
      wickets: currentBowler.w ?? 0,
      runs: currentBowler.r ?? 0
    } : null
  };
}
