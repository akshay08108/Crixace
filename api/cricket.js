import { allowGet, fetchSportmonks, sendApiError } from './_sportmonks.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;

  try {
    const payload = await fetchSportmonks('/livescores', {
      include: 'localteam,visitorteam,balls,runs,bowling.bowler,batting.batsman,scoreboards,venue,league'
    });
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
