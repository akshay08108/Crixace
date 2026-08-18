import { allowGet, fetchSportmonks, sendApiError } from './_sportmonks.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  const matchId = String(request.query.id || '');
  if (!matchId) return response.status(400).json({ error: 'A match ID is required' });

  try {
    const payload = await fetchSportmonks(`/fixtures/${encodeURIComponent(matchId)}`, {
      include: 'localteam,visitorteam,runs,batting.batsman,bowling.bowler,venue,league'
    });
    response.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
