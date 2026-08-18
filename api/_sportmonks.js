const DEFAULT_BASE_URL = 'https://cricket.sportmonks.com/api/v2.0';

export async function fetchSportmonks(path, searchParams = {}) {
  const apiToken = process.env.SPORTMONKS_API_TOKEN;
  const baseUrl = process.env.SPORTMONKS_BASE_URL || DEFAULT_BASE_URL;

  if (!apiToken) {
    const error = new Error('Sportmonks cricket data is not configured');
    error.statusCode = 503;
    throw error;
  }

  const upstreamUrl = new URL(`${baseUrl.replace(/\/$/, '')}${path}`);
  upstreamUrl.searchParams.set('api_token', apiToken);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      upstreamUrl.searchParams.set(key, String(value));
    }
  });

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, { headers: { Accept: 'application/json' } });
  } catch {
    const error = new Error('Unable to reach Sportmonks Cricket');
    error.statusCode = 502;
    throw error;
  }

  const body = await upstreamResponse.text();
  let payload;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    payload = { message: 'Sportmonks returned an invalid response' };
  }

  if (!upstreamResponse.ok || payload?.error) {
    const providerMessage = payload?.message || payload?.error?.message;
    const error = new Error(providerMessage || 'Sportmonks rejected the request');
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
