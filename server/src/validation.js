export function validateRecommendationRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }
  if (typeof body.preferences !== 'string' || !body.preferences.trim()) {
    return { error: 'Please provide your product preferences.' };
  }
  if (body.preferences.trim().length > 1000) {
    return { error: 'Preferences must be 1,000 characters or fewer.' };
  }
  if (body.productIds !== undefined && (!Array.isArray(body.productIds) || body.productIds.length > 100)) {
    return { error: 'productIds must be an array of up to 100 product IDs.' };
  }
  return { value: { preferences: body.preferences.trim(), productIds: body.productIds } };
}
