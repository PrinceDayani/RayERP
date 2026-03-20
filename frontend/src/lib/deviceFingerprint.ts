/**
 * Client-side device fingerprinting
 * Collects browser and device information for security purposes
 */

export interface ClientFingerprint {
  screenResolution: string;
  timezone: string;
  platform: string;
  colorDepth: string;
  deviceMemory?: string;
  hardwareConcurrency: string;
  doNotTrack: string;
  language: string;
  languages: string;
  cookieEnabled: string;
  timestamp: number;
}

/**
 * Generate client-side device fingerprint
 */
export function generateClientFingerprint(): ClientFingerprint {
  const nav = navigator as any;
  
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    colorDepth: `${screen.colorDepth}`,
    deviceMemory: nav.deviceMemory ? `${nav.deviceMemory}` : undefined,
    hardwareConcurrency: `${navigator.hardwareConcurrency || 'unknown'}`,
    doNotTrack: navigator.doNotTrack || 'unknown',
    language: navigator.language,
    languages: navigator.languages?.join(',') || navigator.language,
    cookieEnabled: `${navigator.cookieEnabled}`,
    timestamp: Date.now()
  };
}

/**
 * Encode fingerprint as base64 for transmission
 */
export function encodeFingerprint(fingerprint: ClientFingerprint): string {
  const json = JSON.stringify(fingerprint);
  return btoa(json);
}

/**
 * Get fingerprint header for API requests
 */
export function getFingerprintHeader(): string {
  const fingerprint = generateClientFingerprint();
  return encodeFingerprint(fingerprint);
}

/**
 * Add fingerprint to fetch headers
 */
export function addFingerprintToHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    'X-Fingerprint': getFingerprintHeader()
  };
}

/**
 * Store fingerprint in session storage for consistency
 */
export function storeFingerprint(): void {
  if (typeof window === 'undefined') return;
  
  const fingerprint = generateClientFingerprint();
  sessionStorage.setItem('device-fingerprint', JSON.stringify(fingerprint));
}

/**
 * Get stored fingerprint or generate new one
 */
export function getStoredFingerprint(): ClientFingerprint {
  if (typeof window === 'undefined') {
    return generateClientFingerprint();
  }
  
  const stored = sessionStorage.getItem('device-fingerprint');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid stored fingerprint, generate new one
    }
  }
  
  const fingerprint = generateClientFingerprint();
  storeFingerprint();
  return fingerprint;
}

/**
 * Initialize fingerprinting on app load
 */
export function initializeFingerprinting(): void {
  if (typeof window === 'undefined') return;
  
  // Store fingerprint on load
  storeFingerprint();
  
  // Update fingerprint on visibility change (detect tab switching)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      storeFingerprint();
    }
  });
}

/**
 * Get device description for display
 */
export function getDeviceDescription(): string {
  const ua = navigator.userAgent.toLowerCase();
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent)) {
    deviceType = 'Mobile';
  }

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return `${deviceType} - ${browser} on ${os}`;
}
