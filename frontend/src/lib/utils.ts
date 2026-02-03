import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Retry Utility
type FetchFunction = () => Promise<Response>;

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryOn?: (response: Response | null, error: Error | null) => boolean;
}

const defaultRetryOn = (response: Response | null, error: Error | null): boolean => {
  if (error) return true; // Network errors
  if (!response) return false;
  return response.status >= 500; // Server errors only
};

export async function fetchWithRetry(
  fetchFn: FetchFunction,
  options: RetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryOn = defaultRetryOn
  } = options;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchFn();
      
      if (!retryOn(response, null)) {
        return response;
      }

      lastResponse = response;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error as Error;

      if (!retryOn(null, lastError) || attempt === maxAttempts) {
        throw error;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('Max retry attempts reached');
}
