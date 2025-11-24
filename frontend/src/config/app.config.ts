export const APP_CONFIG = {
  name: 'RayERP',
  version: '1.0.0',
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL,
    timeout: 10000,
  },
  auth: {
    tokenKey: 'rayerp_token',
    refreshTokenKey: 'rayerp_refresh_token',
  },
  currency: {
    default: 'INR',
    symbol: '₹',
    locale: 'en-IN',
  },
} as const;
