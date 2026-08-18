import { allowGet, fetchSportmonks, sendApiError } from './_sportmonks.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  const teamId = String(request.query.teamid || request.query.team_id || '');
  if (!teamId) return response.status(400).json({ error: 'A team ID is required' });
  try {
    const payload = await fetchSportmonks(`/teams/${encodeURIComponent(teamId)}`);
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
