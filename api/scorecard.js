import { allowGet, fetchRapidCricket, sendApiError } from './_rapidapi.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  const matchId = String(request.query.id || '');
  if (!matchId) return response.status(400).json({ error: 'A match ID is required' });

  try {
    const payload = await fetchRapidCricket('/cricket-match-scoreboard', { matchid: matchId });
    response.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
