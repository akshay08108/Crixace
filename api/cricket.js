const DEFAULT_BASE_URL = 'https://api.cricapi.com/v1';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CRICKETDATA_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ error: 'Cricket Data is not configured' });
  }

  const baseUrl = (process.env.CRICKETDATA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const upstreamUrl = new URL(`${baseUrl}/currentMatches`);
  upstreamUrl.searchParams.set('apikey', apiKey);
  upstreamUrl.searchParams.set('offset', String(request.query.offset || 0));

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' }
    });
    const payload = await upstreamResponse.json();
    const { apikey: _upstreamApiKey, ...safePayload } = payload;

    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return response.status(upstreamResponse.status).json(safePayload);
  } catch {
    return response.status(502).json({ error: 'Unable to reach Cricket Data' });
  }
}
