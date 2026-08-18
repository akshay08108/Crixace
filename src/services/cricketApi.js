const TEAM_COLORS = ['#2563eb', '#7c3aed'];

async function getJson(endpoint, label) {
  const response = await fetch(endpoint);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `${label} request failed: ${response.status}`);
  if (payload?.error) throw new Error(payload.error?.message || payload.message || `${label} is unavailable`);
  return payload?.data ?? payload;
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function shortCode(team) {
  const name = firstDefined(team?.code, team?.name, 'TBD');
  return String(name).replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TBD';
}

function latestTeamRun(runs, teamId) {
  const teamRuns = (Array.isArray(runs) ? runs : [])
    .filter(run => String(run?.team_id) === String(teamId))
    .sort((a, b) => Number(a?.inning || 0) - Number(b?.inning || 0));
  return teamRuns[teamRuns.length - 1] || null;
}

function teamImage(team) {
  const image = String(firstDefined(team?.image_path, team?.image, ''));
  if (!image) return '';
  try {
    const url = new URL(image);
    return url.pathname && url.pathname !== '/' ? image : '';
  } catch {
    return image;
  }
}

function normalizeTeam(team, run) {
  const score = run?.score === undefined || run?.score === null
    ? '—'
    : `${run.score}${run?.wickets === undefined || run?.wickets === null ? '' : `/${run.wickets}`}`;
  return {
    id: String(firstDefined(team?.id, `team-${shortCode(team)}`)),
    code: shortCode(team),
    name: String(firstDefined(team?.name, 'Team')),
    image: teamImage(team),
    score,
    overs: run?.overs === undefined || run?.overs === null ? '' : String(run.overs)
  };
}

function inferState(item, fallback = 'upcoming') {
  const status = String(item?.status || '').toLowerCase();
  if (/finished|complete|abandon|cancel|walkover|draw/.test(status)) return 'completed';
  if (/not started|scheduled|ns/.test(status)) return 'upcoming';
  if (/innings|lunch|tea|stumps|break|delayed|live/.test(status)) return 'live';
  return fallback;
}

function displayDate(value) {
  if (!value) return '';
  const parsed = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function normalizeSportmonksMatch(item, index = 0, fallbackState = 'upcoming') {
  const localTeam = item?.localteam || {};
  const visitorTeam = item?.visitorteam || {};
  const runs = Array.isArray(item?.runs) ? item.runs : [];
  const state = inferState(item, fallbackState);
  const venue = item?.venue || {};
  const scheduled = displayDate(item?.starting_at);
  const status = String(item?.status || '');
  const note = state === 'upcoming' && /^(ns|not started|scheduled)$/i.test(status)
    ? scheduled
    : firstDefined(item?.note, status, scheduled);

  return {
    id: String(firstDefined(item?.id, `sportmonks-${index}`)),
    state,
    competition: [item?.league?.name, item?.round || item?.type, venue?.city || venue?.name].filter(Boolean).join(' · ') || 'Cricket match',
    teams: [
      normalizeTeam(localTeam, latestTeamRun(runs, localTeam?.id)),
      normalizeTeam(visitorTeam, latestTeamRun(runs, visitorTeam?.id))
    ],
    note: String(firstDefined(note, state === 'live' ? 'Live now' : state === 'completed' ? 'Match completed' : 'Upcoming match')),
    colors: TEAM_COLORS
  };
}

export async function fetchCricketMatches() {
  const response = await getJson('/api/cricket', 'Live scores');
  return (Array.isArray(response) ? response : []).map((item, index) => normalizeSportmonksMatch(item, index, 'live'));
}

export async function fetchFixtures() {
  const response = await getJson('/api/fixtures', 'Fixtures');
  return (Array.isArray(response) ? response : []).map((item, index) => normalizeSportmonksMatch(item, index, 'upcoming'));
}

export async function fetchSeries() {
  const response = await getJson('/api/series', 'Series');
  if (!Array.isArray(response)) return [];
  return response.map((league, index) => {
    const seasons = Array.isArray(league?.seasons) ? league.seasons : [];
    const currentSeason = seasons.find(season => String(season?.id) === String(league?.season_id)) || seasons[seasons.length - 1];
    return {
      id: String(firstDefined(league?.id, `series-${index}`)),
      name: [firstDefined(league?.name, 'Cricket series'), currentSeason?.name].filter(Boolean).join(' · '),
      dates: String(firstDefined(currentSeason?.name, league?.code, 'Schedule to be announced')),
      month: ''
    };
  });
}

function numberValue(item, ...keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return 0;
}

function playerName(item, relation, fallback) {
  const player = item?.[relation] || {};
  return String(firstDefined(player?.fullname, player?.name, item?.name, fallback));
}

function latestScoreboard(entries) {
  const scoreboards = entries.map(entry => Number(entry?.scoreboard)).filter(Number.isFinite);
  return scoreboards.length ? Math.max(...scoreboards) : null;
}

export async function fetchMatchScorecard(matchId) {
  const match = await getJson(`/api/scorecard?id=${encodeURIComponent(matchId)}`, 'Scorecard');
  const batting = Array.isArray(match?.batting) ? match.batting : [];
  const bowling = Array.isArray(match?.bowling) ? match.bowling : [];
  if (!batting.length && !bowling.length) throw new Error('No scorecard is available');

  const inning = latestScoreboard([...batting, ...bowling]);
  const inningBatters = inning === null ? batting : batting.filter(player => Number(player?.scoreboard) === inning);
  const inningBowlers = inning === null ? bowling : bowling.filter(player => Number(player?.scoreboard) === inning);
  const activeBatters = inningBatters.filter(player => player?.active === true);
  const displayedBatters = (activeBatters.length ? activeBatters : inningBatters.slice(-2)).slice(-2);
  const currentBowler = inningBowlers.find(player => player?.active === true) || inningBowlers[inningBowlers.length - 1] || null;
  const bowlerOvers = currentBowler ? numberValue(currentBowler, 'overs') : 0;
  const [completedOvers = '0', ballsInCurrentOver = '0'] = String(bowlerOvers).split('.');

  return {
    inning: inning === null ? 'Current innings' : `Innings ${inning}`,
    batters: displayedBatters.map(player => ({
      name: playerName(player, 'batsman', 'Batter'),
      runs: numberValue(player, 'score', 'runs'),
      balls: numberValue(player, 'ball', 'balls')
    })),
    bowler: currentBowler ? {
      name: playerName(currentBowler, 'bowler', 'Bowler'),
      overs: bowlerOvers,
      balls: (Number(completedOvers) * 6) + Number(ballsInCurrentOver),
      currentOver: Number(completedOvers) + 1,
      ballsInCurrentOver: Number(ballsInCurrentOver),
      wickets: numberValue(currentBowler, 'wickets'),
      runs: numberValue(currentBowler, 'runs')
    } : null
  };
}
