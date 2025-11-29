/**
 * PAN (Permanent Account Number) Validator for Indian Tax System
 * Format: AAAAA9999A (5 letters + 4 digits + 1 letter)
 */

export interface PANValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

export const validatePAN = (pan: string): PANValidationResult => {
  if (!pan || typeof pan !== 'string') {
    return { isValid: true }; // Allow empty PAN
  }

  // Remove spaces and convert to uppercase
  const cleanPAN = pan.trim().toUpperCase().replace(/\s/g, '');

  // Check if empty after cleaning
  if (!cleanPAN) {
    return { isValid: true }; // Allow empty PAN
  }

  // Check length
  if (cleanPAN.length !== 10) {
    return {
      isValid: false,
      error: `PAN must be exactly 10 characters long. Current length: ${cleanPAN.length}`
    };
  }

  // Check format: AAAAA9999A
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(cleanPAN)) {
    // Provide specific error messages
    if (!/^[A-Z]{5}/.test(cleanPAN.substring(0, 5))) {
      return {
        isValid: false,
        error: 'First 5 characters must be uppercase letters (A-Z)'
      };
    }
    
    if (!/^[0-9]{4}$/.test(cleanPAN.substring(5, 9))) {
      return {
        isValid: false,
        error: 'Characters 6-9 must be digits (0-9)'
      };
    }
    
    if (!/^[A-Z]$/.test(cleanPAN.substring(9, 10))) {
      return {
        isValid: false,
        error: 'Last character must be an uppercase letter (A-Z)'
      };
    }
    
    return {
      isValid: false,
      error: 'Invalid PAN format. Expected format: AAAAA9999A (5 letters + 4 digits + 1 letter)'
    };
  }

  return {
    isValid: true,
    formatted: cleanPAN
  };
};

export const isPANValid = (pan: string): boolean => {
  return validatePAN(pan).isValid;
};