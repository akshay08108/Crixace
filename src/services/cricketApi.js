const TEAM_COLORS = ['#2563eb', '#7c3aed'];

async function getJson(endpoint, label) {
  const response = await fetch(endpoint);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `${label} request failed: ${response.status}`);
  if (payload?.status && payload.status !== 'success') throw new Error(payload?.message || `${label} is unavailable`);
  return payload?.response ?? payload?.data ?? payload;
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function shortCode(team) {
  const name = firstDefined(team?.teamSName, team?.shortName, team?.code, team?.teamName, team?.name, team?.title, 'TBD');
  return String(name).replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TBD';
}

function latestInnings(score) {
  if (!score || typeof score !== 'object') return null;
  const candidates = Object.values(score).filter(value => value && typeof value === 'object');
  return candidates[candidates.length - 1] || score;
}

function normalizeScore(score) {
  const innings = latestInnings(score);
  const runs = firstDefined(innings?.runs, innings?.r, score?.runs, score?.r);
  const wickets = firstDefined(innings?.wickets, innings?.w, score?.wickets, score?.w);
  const overs = firstDefined(innings?.overs, innings?.o, score?.overs, score?.o);
  return {
    score: runs === undefined ? '—' : `${runs}${wickets === undefined ? '' : `/${wickets}`}`,
    overs: overs === undefined ? '' : String(overs)
  };
}

function teamImage(team) {
  const suppliedImage = firstDefined(team?.image, team?.logo, team?.imageUrl);
  if (suppliedImage) return suppliedImage;
  const imageId = firstDefined(team?.imageId, team?.teamImageId);
  return imageId ? `https://static.cricbuzz.com/a/img/v1/72x54/i1/c${imageId}/team.jpg` : '';
}

function normalizeTeam(team, score) {
  const normalizedScore = normalizeScore(score);
  return {
    id: String(firstDefined(team?.teamId, team?.id, `team-${shortCode(team)}`)),
    code: shortCode(team),
    name: String(firstDefined(team?.teamName, team?.name, team?.title, 'Team')),
    image: teamImage(team),
    ...normalizedScore
  };
}

function inferState(info, fallback = 'upcoming') {
  const value = String(firstDefined(info?.state, info?.status, info?.matchStatus, '')).toLowerCase();
  if (info?.matchEnded || /complete|result|won|draw|abandon/.test(value)) return 'completed';
  if (info?.matchStarted || /live|progress|innings|stumps|break/.test(value)) return 'live';
  if (/upcoming|scheduled|preview/.test(value)) return 'upcoming';
  return fallback;
}

function normalizeMatch(item, index, fallbackState = 'live') {
  const info = item?.matchInfo || item?.match || item || {};
  const score = item?.matchScore || item?.score || info?.matchScore || {};
  const team1 = info?.team1 || info?.teams?.[0] || item?.team1 || {};
  const team2 = info?.team2 || info?.teams?.[1] || item?.team2 || {};
  const team1Score = score?.team1Score || score?.team1 || item?.team1Score || team1?.score;
  const team2Score = score?.team2Score || score?.team2 || item?.team2Score || team2?.score;
  const venue = info?.venueInfo || info?.venue || {};
  const state = inferState(info, fallbackState);
  const dateValue = firstDefined(info?.startDate, info?.date, item?.date);
  const scheduled = dateValue && !Number.isNaN(Number(dateValue))
    ? new Date(Number(dateValue)).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : dateValue;

  return {
    id: String(firstDefined(info?.matchId, info?.id, item?.matchId, item?.id, `rapid-${index}`)),
    state,
    competition: [firstDefined(info?.seriesName, item?.seriesName), firstDefined(info?.matchDesc, info?.matchFormat), firstDefined(venue?.city, venue?.ground)].filter(Boolean).join(' · ') || 'Cricket match',
    teams: [normalizeTeam(team1, team1Score), normalizeTeam(team2, team2Score)],
    note: String(firstDefined(info?.status, info?.stateTitle, item?.status, scheduled, state === 'live' ? 'Live now' : state === 'completed' ? 'Match completed' : 'Upcoming match')),
    colors: TEAM_COLORS
  };
}

function flattenMatches(value, fallbackState) {
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (item?.matchInfo || item?.matchId || item?.match) return [item];
      return flattenMatches(item, fallbackState);
    });
  }
  if (!value || typeof value !== 'object') return [];
  for (const key of ['matches', 'matchList', 'matchInfo', 'typeMatches', 'seriesMatches']) {
    if (Array.isArray(value[key])) return flattenMatches(value[key], fallbackState);
  }
  return [];
}

function flattenSchedule(response) {
  const schedules = Array.isArray(response?.schedules) ? response.schedules : Array.isArray(response) ? response : [];
  const matches = [];
  schedules.forEach(scheduleEntry => {
    const wrapper = scheduleEntry?.scheduleAdWrapper || scheduleEntry?.scheduleWrapper || scheduleEntry;
    const groups = Array.isArray(wrapper?.matchScheduleList) ? wrapper.matchScheduleList : [];
    groups.forEach(group => {
      const matchInfo = Array.isArray(group?.matchInfo) ? group.matchInfo : [];
      matchInfo.forEach(info => matches.push({
        matchInfo: { ...info, seriesName: info.seriesName || group.seriesName, date: info.startDate || wrapper.longDate || wrapper.date }
      }));
    });
  });
  return matches;
}

export async function fetchCricketMatches() {
  const response = await getJson('/api/cricket', 'Live scores');
  return flattenMatches(response, 'live').map((item, index) => normalizeMatch(item, index, 'live'));
}

export async function fetchFixtures() {
  const response = await getJson('/api/fixtures', 'Fixtures');
  return flattenSchedule(response).map((item, index) => normalizeMatch(item, index, 'upcoming'));
}

export async function fetchSeries() {
  const response = await getJson('/api/series', 'Series');
  if (!Array.isArray(response)) return [];
  return response.map((item, index) => ({
    id: String(firstDefined(item?.id, item?.seriesId, item?.url, `series-${index}`)),
    name: String(firstDefined(item?.series, item?.seriesName, item?.name, item?.title, 'Cricket series')),
    dates: String(firstDefined(item?.dates, item?.date, item?.month, 'Schedule to be announced')),
    month: String(firstDefined(item?.month) || '')
  }));
}

function numberValue(item, ...keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return 0;
}

function playerName(item, fallback) {
  return String(firstDefined(item?.name, item?.batsmanName, item?.batterName, item?.bowlerName, item?.batsman?.name, item?.bowler?.name, fallback));
}

function inningsHasData(innings) {
  return Array.isArray(innings?.batters) && innings.batters.length || Array.isArray(innings?.bowlers) && innings.bowlers.length;
}

export async function fetchMatchScorecard(matchId) {
  const response = await getJson(`/api/scorecard?id=${encodeURIComponent(matchId)}`, 'Scorecard');
  const inningsList = Array.isArray(response) ? response : Object.values(response || {}).filter(value => value && typeof value === 'object');
  const currentInnings = [...inningsList].reverse().find(inningsHasData);
  if (!currentInnings) throw new Error('No scorecard is available');

  const batting = Array.isArray(currentInnings.batters) ? currentInnings.batters : [];
  const bowling = Array.isArray(currentInnings.bowlers) ? currentInnings.bowlers : [];
  const activeBatters = batting.filter(player => {
    const dismissal = String(firstDefined(player?.dismissal, player?.dismissalText, player?.outDesc, player?.status, '')).toLowerCase();
    return !dismissal || /not out|batting/.test(dismissal);
  }).slice(-2);
  const currentBowler = bowling[bowling.length - 1] || null;
  const bowlerOvers = currentBowler ? numberValue(currentBowler, 'overs', 'o') : 0;
  const [, ballsInCurrentOver = '0'] = String(bowlerOvers).split('.');

  return {
    inning: String(firstDefined(currentInnings?.name, currentInnings?.title, currentInnings?.label, 'Current innings')),
    batters: activeBatters.map(player => ({
      name: playerName(player, 'Batter'),
      runs: numberValue(player, 'runs', 'r'),
      balls: numberValue(player, 'balls', 'b')
    })),
    bowler: currentBowler ? {
      name: playerName(currentBowler, 'Bowler'),
      overs: bowlerOvers,
      balls: (Math.floor(Number(bowlerOvers)) * 6) + Number(ballsInCurrentOver),
      currentOver: Math.floor(Number(bowlerOvers)) + 1,
      ballsInCurrentOver: Number(ballsInCurrentOver),
      wickets: numberValue(currentBowler, 'wickets', 'w'),
      runs: numberValue(currentBowler, 'runs', 'r')
    } : null
  };
}
