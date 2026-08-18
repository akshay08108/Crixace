const DEFAULT_BASE_URL = 'https://api.cricapi.com/v1';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CRICKETDATA_API_KEY;
  const matchId = String(request.query.id || '');
  if (!apiKey) return response.status(503).json({ error: 'Cricket Data is not configured' });
  if (!matchId) return response.status(400).json({ error: 'A match ID is required' });

  const baseUrl = (process.env.CRICKETDATA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const upstreamUrl = new URL(`${baseUrl}/match_scorecard`);
  upstreamUrl.searchParams.set('apikey', apiKey);
  upstreamUrl.searchParams.set('id', matchId);

  try {
    const upstreamResponse = await fetch(upstreamUrl, { headers: { Accept: 'application/json' } });
    const payload = await upstreamResponse.json();
    const { apikey: _upstreamApiKey, ...safePayload } = payload;
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return response.status(upstreamResponse.status).json(safePayload);
  } catch {
    return response.status(502).json({ error: 'Unable to reach the scorecard feed' });
  }
}
