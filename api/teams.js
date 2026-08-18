import { allowGet, fetchRapidCricket, sendApiError } from './_rapidapi.js';

export default async function handler(request, response) {
  if (!allowGet(request, response)) return;
  try {
    const payload = await fetchRapidCricket('/cricket-teams');
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return response.status(200).json(payload);
  } catch (error) {
    return sendApiError(response, error);
  }
}
