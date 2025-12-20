import crypto from 'crypto';

// Calculate risk level based on action, module, and time
export const calculateRiskLevel = (
  action: string,
  module: string,
  status: string,
  timestamp: Date = new Date()
): 'Low' | 'Medium' | 'High' | 'Critical' => {
  let score = 0;

  // Action risk
  if (action === 'DELETE') score += 3;
  else if (action === 'UPDATE') score += 2;
  else if (action === 'CREATE') score += 1;
  else if (action === 'LOGIN' && status === 'Failed') score += 2;

  // Module risk
  const highRiskModules = ['FINANCE', 'ACCOUNTING', 'PAYROLL', 'BANKING'];
  const mediumRiskModules = ['EMPLOYEE', 'INVENTORY', 'ORDER'];
  if (highRiskModules.includes(module.toUpperCase())) score += 2;
  else if (mediumRiskModules.includes(module.toUpperCase())) score += 1;

  // Time risk (after hours: 6 PM - 6 AM)
  const hour = timestamp.getHours();
  if (hour >= 18 || hour < 6) score += 1;

  // Status risk
  if (status === 'Failed') score += 2;

  // Calculate final risk level
  if (score >= 6) return 'Critical';
  if (score >= 4) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
};

// Mask sensitive data in values
export const maskSensitiveData = (value: string | undefined): string => {
  if (!value) return '';

  let masked = value;

  // Credit card (16 digits)
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, (match) => {
    const last4 = match.slice(-4);
    return `****-****-****-${last4}`;
  });

  // SSN (XXX-XX-XXXX)
  masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');

  // Email (keep first 2 chars and domain)
  masked = masked.replace(/\b([a-zA-Z0-9]{1,2})[a-zA-Z0-9._-]*@/g, '$1***@');

  // Phone (keep last 4 digits)
  masked = masked.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, (match) => {
    const last4 = match.slice(-4);
    return `***-***-${last4}`;
  });

  // Password fields
  if (value.toLowerCase().includes('password')) {
    masked = '[REDACTED]';
  }

  return masked.substring(0, 5000);
};

// Generate hash for log integrity
export const generateLogHash = (
  timestamp: Date,
  userId: string,
  action: string,
  module: string,
  previousHash: string = ''
): string => {
  const data = `${timestamp.toISOString()}|${userId}|${action}|${module}|${previousHash}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Get last log hash for chain
export const getLastLogHash = async (AuditLog: any): Promise<string> => {
  const lastLog = await AuditLog.findOne()
    .sort({ timestamp: -1 })
    .select('currentHash')
    .lean();
  return lastLog?.currentHash || '';
};

// Detect failed login attempts
export const checkFailedLoginAttempts = async (
  AuditLog: any,
  userEmail: string,
  ipAddress: string,
  timeWindowMinutes: number = 10
): Promise<{ count: number; shouldAlert: boolean }> => {
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const count = await AuditLog.countDocuments({
    action: 'LOGIN',
    status: 'Failed',
    $or: [{ userEmail }, { ipAddress }],
    timestamp: { $gte: cutoffTime }
  });

  return {
    count,
    shouldAlert: count >= 5
  };
};

// Get geolocation from IP (basic implementation)
export const getGeolocation = async (ipAddress: string): Promise<{
  country?: string;
  city?: string;
  timezone?: string;
}> => {
  // Basic implementation - in production, use a service like MaxMind or ipapi
  if (ipAddress === 'unknown' || ipAddress.startsWith('127.') || ipAddress.startsWith('::')) {
    return { country: 'Local', city: 'Local', timezone: 'UTC' };
  }
  
  // Placeholder - integrate with IP geolocation service
  return {
    country: 'Unknown',
    city: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};
