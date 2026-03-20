import crypto from 'crypto';

export interface DeviceFingerprint {
  hash: string;
  components: {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    ipAddress: string;
    screenResolution?: string;
    timezone?: string;
    platform?: string;
    colorDepth?: string;
    deviceMemory?: string;
    hardwareConcurrency?: string;
    doNotTrack?: string;
  };
  confidence: 'high' | 'medium' | 'low';
}

export interface FingerprintRequest {
  headers: {
    'user-agent'?: string;
    'accept-language'?: string;
    'accept-encoding'?: string;
    'x-fingerprint'?: string;
  };
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

/**
 * Generate device fingerprint from request headers and client data
 */
export function generateDeviceFingerprint(req: FingerprintRequest): DeviceFingerprint {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const acceptLanguage = req.headers['accept-language'] || 'Unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'Unknown';
  const ipAddress = req.ip || req.socket?.remoteAddress || 'Unknown';

  // Parse client-side fingerprint if provided
  let clientFingerprint: any = {};
  try {
    const fingerprintHeader = req.headers['x-fingerprint'];
    if (fingerprintHeader) {
      clientFingerprint = JSON.parse(Buffer.from(fingerprintHeader, 'base64').toString('utf-8'));
    }
  } catch (error) {
    // Invalid fingerprint header, ignore
  }

  const components = {
    userAgent,
    acceptLanguage,
    acceptEncoding,
    ipAddress,
    screenResolution: clientFingerprint.screenResolution,
    timezone: clientFingerprint.timezone,
    platform: clientFingerprint.platform,
    colorDepth: clientFingerprint.colorDepth,
    deviceMemory: clientFingerprint.deviceMemory,
    hardwareConcurrency: clientFingerprint.hardwareConcurrency,
    doNotTrack: clientFingerprint.doNotTrack
  };

  // Generate hash from all components
  const fingerprintString = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    ipAddress,
    clientFingerprint.screenResolution,
    clientFingerprint.timezone,
    clientFingerprint.platform,
    clientFingerprint.colorDepth,
    clientFingerprint.deviceMemory,
    clientFingerprint.hardwareConcurrency
  ].filter(Boolean).join('|');

  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  // Determine confidence level based on available data
  let confidence: 'high' | 'medium' | 'low' = 'low';
  const clientDataPoints = Object.values(clientFingerprint).filter(Boolean).length;
  
  if (clientDataPoints >= 6) {
    confidence = 'high';
  } else if (clientDataPoints >= 3) {
    confidence = 'medium';
  }

  return {
    hash,
    components,
    confidence
  };
}

/**
 * Compare two device fingerprints
 */
export function compareFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): {
  match: boolean;
  similarity: number;
  differences: string[];
} {
  const differences: string[] = [];
  let matchingComponents = 0;
  let totalComponents = 0;

  // Compare each component
  const keys = Object.keys(fp1.components) as Array<keyof typeof fp1.components>;
  
  for (const key of keys) {
    const val1 = fp1.components[key];
    const val2 = fp2.components[key];
    
    if (val1 && val2) {
      totalComponents++;
      if (val1 === val2) {
        matchingComponents++;
      } else {
        differences.push(key);
      }
    }
  }

  const similarity = totalComponents > 0 ? matchingComponents / totalComponents : 0;
  
  // Consider it a match if:
  // 1. Hash matches exactly, OR
  // 2. Similarity >= 80% and critical components match
  const criticalMatch = 
    fp1.components.userAgent === fp2.components.userAgent &&
    fp1.components.platform === fp2.components.platform;
  
  const match = fp1.hash === fp2.hash || (similarity >= 0.8 && criticalMatch);

  return {
    match,
    similarity,
    differences
  };
}

/**
 * Detect if device fingerprint has changed suspiciously
 */
export function isSuspiciousChange(
  oldFingerprint: DeviceFingerprint,
  newFingerprint: DeviceFingerprint
): {
  suspicious: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
} {
  const comparison = compareFingerprints(oldFingerprint, newFingerprint);

  // If fingerprints match, not suspicious
  if (comparison.match) {
    return { suspicious: false, severity: 'low' };
  }

  // Check for critical component changes
  const criticalChanges: string[] = [];

  // User agent change is highly suspicious
  if (oldFingerprint.components.userAgent !== newFingerprint.components.userAgent) {
    criticalChanges.push('userAgent');
  }

  // Platform change is highly suspicious
  if (oldFingerprint.components.platform !== newFingerprint.components.platform) {
    criticalChanges.push('platform');
  }

  // IP address change is moderately suspicious
  if (oldFingerprint.components.ipAddress !== newFingerprint.components.ipAddress) {
    criticalChanges.push('ipAddress');
  }

  // Timezone change is moderately suspicious
  if (oldFingerprint.components.timezone !== newFingerprint.components.timezone) {
    criticalChanges.push('timezone');
  }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' = 'low';
  let reason = '';

  if (criticalChanges.includes('userAgent') || criticalChanges.includes('platform')) {
    severity = 'high';
    reason = `Critical device components changed: ${criticalChanges.join(', ')}`;
  } else if (criticalChanges.includes('ipAddress') && criticalChanges.includes('timezone')) {
    severity = 'high';
    reason = 'Location and timezone changed simultaneously';
  } else if (criticalChanges.length >= 3) {
    severity = 'medium';
    reason = `Multiple components changed: ${criticalChanges.join(', ')}`;
  } else if (criticalChanges.length > 0) {
    severity = 'low';
    reason = `Minor changes detected: ${criticalChanges.join(', ')}`;
  }

  return {
    suspicious: criticalChanges.length > 0,
    reason,
    severity
  };
}

/**
 * Generate a human-readable device description
 */
export function getDeviceDescription(fingerprint: DeviceFingerprint): string {
  const { components } = fingerprint;
  
  // Parse user agent for device type
  const ua = components.userAgent.toLowerCase();
  let deviceType = 'Unknown Device';
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(components.userAgent)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(components.userAgent)) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // Parse browser
  let browser = 'Unknown Browser';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // Parse OS
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return `${deviceType} - ${browser} on ${os}`;
}

/**
 * Sanitize fingerprint for storage (remove sensitive data)
 */
export function sanitizeFingerprint(fingerprint: DeviceFingerprint): DeviceFingerprint {
  return {
    ...fingerprint,
    components: {
      ...fingerprint.components,
      // Mask last octet of IP address for privacy
      ipAddress: fingerprint.components.ipAddress.replace(/\.\d+$/, '.xxx')
    }
  };
}
