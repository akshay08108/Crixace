import { allowGet, fetchSportmonks, sendApiError } from './_sportmonks.js';

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  try {
    const from = new Date();
    const until = new Date(from);
    until.setUTCDate(until.getUTCDate() + 180);
    const payload = await fetchSportmonks('/fixtures', {
      'filter[starts_between]': `${dateOnly(from)},${dateOnly(until)}`,
      include: 'localteam,visitorteam,balls,runs,bowling.bowler,batting.batsman,scoreboards,tosswon,venue,league',
      sort: 'starting_at',
      per_page: 100
    });
    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
