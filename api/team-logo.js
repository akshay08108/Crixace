import { allowGet, fetchRapidCricket, sendApiError } from './_rapidapi.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  const teamId = String(request.query.teamid || '');
  if (!teamId) return response.status(400).json({ error: 'A team ID is required' });
  try {
    const payload = await fetchRapidCricket('/cricket-teamlogo', { teamid: teamId });
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
