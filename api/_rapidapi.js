const DEFAULT_HOST = 'cricket-api-free-data.p.rapidapi.com';

export async function fetchRapidCricket(path, searchParams = {}) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || DEFAULT_HOST;

  if (!apiKey) {
    const error = new Error('RapidAPI cricket data is not configured');
    error.statusCode = 503;
    throw error;
  }

  const upstreamUrl = new URL(`https://${host}${path}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      upstreamUrl.searchParams.set(key, String(value));
    }
  });

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host
      }
    });
  } catch {
    const error = new Error('Unable to reach the cricket data provider');
    error.statusCode = 502;
    throw error;
  }

  const body = await upstreamResponse.text();
  let payload;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    payload = { error: 'The cricket data provider returned an invalid response' };
  }

  if (!upstreamResponse.ok || payload?.status === 'error' || payload?.message === 'You are not subscribed to this API.') {
    const error = new Error(payload?.message || payload?.error || 'The cricket data provider rejected the request');
    error.statusCode = upstreamResponse.status === 429 ? 429 : upstreamResponse.status || 502;
    throw error;
  }

  return payload;
}

export function allowGet(request, response) {
  if (request.method === 'GET') return true;
  response.setHeader('Allow', 'GET');
  response.status(405).json({ error: 'Method not allowed' });
  return false;
}

export function sendApiError(response, error) {
  return response.status(error.statusCode || 502).json({ error: error.message || 'Cricket data is unavailable' });
}
