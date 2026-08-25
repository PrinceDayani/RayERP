import api from './api';

// The backend binds a CSRF token to the user and their device fingerprint for
// one hour (see backend csrf.middleware). Tokens are cached here and refreshed
// on demand so state-changing calls do not fetch one every time.

const CSRF_HEADER = 'X-CSRF-Token';

let cachedToken: string | null = null;
let inFlight: Promise<string> | null = null;

/** Fetch (or reuse) a CSRF token for the current session. */
export async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken) return cachedToken;

  // Collapse concurrent callers onto a single request.
  if (!inFlight) {
    inFlight = api
      .get('/csrf/token')
      .then(response => {
        const token = response.data?.csrfToken;
        if (!token) throw new Error('Server did not return a CSRF token');
        cachedToken = token;
        return token;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

/** Drop the cached token, e.g. after logout or a rejected token. */
export function resetCsrfToken(): void {
  cachedToken = null;
}

export async function csrfHeaders(forceRefresh = false): Promise<Record<string, string>> {
  return { [CSRF_HEADER]: await getCsrfToken(forceRefresh) };
}

const CSRF_ERROR_CODES = [
  'CSRF_TOKEN_MISSING',
  'CSRF_TOKEN_EXPIRED',
  'CSRF_TOKEN_INVALID',
  'CSRF_DEVICE_MISMATCH'
];

const isCsrfRejection = (error: any): boolean =>
  error?.response?.status === 403 && CSRF_ERROR_CODES.includes(error?.response?.data?.code);

/**
 * Runs a mutating request with a CSRF header, retrying once with a fresh token
 * if the server rejected the cached one (it expires after an hour, and rotates
 * when the device fingerprint changes).
 */
export async function withCsrf<T>(request: (headers: Record<string, string>) => Promise<T>): Promise<T> {
  try {
    return await request(await csrfHeaders());
  } catch (error) {
    if (!isCsrfRejection(error)) throw error;

    resetCsrfToken();
    return request(await csrfHeaders(true));
  }
}
