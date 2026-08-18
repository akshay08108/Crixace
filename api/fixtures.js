import { allowGet, fetchRapidCricket, sendApiError } from './_rapidapi.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  try {
    const payload = await fetchRapidCricket('/cricket-schedule');
    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
