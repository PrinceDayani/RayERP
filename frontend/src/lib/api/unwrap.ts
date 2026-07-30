// Tolerates both the standardized `{ success, data }` response envelope and
// legacy bare payloads (a raw array/object returned directly by older endpoints).
// Use in API-module functions so a backend shape change from bare -> enveloped
// keeps the function's returned payload identical for callers.
//
//   const res = await api.get('/x');
//   return unwrapResponse(res.data);   // array today, array after standardization
//
// If the body is the `{ success, data }` envelope, its `data` is returned;
// otherwise the body is passed through unchanged.
export function unwrapResponse<T = any>(body: any): T {
  if (
    body !== null &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body
  ) {
    return body.data as T;
  }
  return body as T;
}

export default unwrapResponse;
