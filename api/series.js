import { allowGet, fetchSportmonks, sendApiError } from './_sportmonks.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  try {
    const payload = await fetchSportmonks('/leagues', { include: 'seasons' });
    response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
