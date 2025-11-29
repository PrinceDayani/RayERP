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
      error: 'PAN must be exactly 10 characters long'
    };
  }

  // Check format: AAAAA9999A
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(cleanPAN)) {
    // Provide specific error messages
    if (!/^[A-Z]{5}/.test(cleanPAN.substring(0, 5))) {
      return {
        isValid: false,
        error: 'First 5 characters must be uppercase letters'
      };
    }
    
    if (!/^[0-9]{4}$/.test(cleanPAN.substring(5, 9))) {
      return {
        isValid: false,
        error: 'Characters 6-9 must be digits'
      };
    }
    
    if (!/^[A-Z]$/.test(cleanPAN.substring(9, 10))) {
      return {
        isValid: false,
        error: 'Last character must be an uppercase letter'
      };
    }
    
    return {
      isValid: false,
      error: 'Invalid PAN format. Expected format: AAAAA9999A'
    };
  }

  return {
    isValid: true,
    formatted: cleanPAN
  };
};

export const formatPAN = (pan: string): string => {
  if (!pan) return '';
  
  const cleanPAN = pan.trim().toUpperCase().replace(/\s/g, '');
  
  // Add spaces for better readability: AAAAA 9999 A
  if (cleanPAN.length >= 5) {
    let formatted = cleanPAN.substring(0, 5);
    if (cleanPAN.length >= 9) {
      formatted += ' ' + cleanPAN.substring(5, 9);
      if (cleanPAN.length === 10) {
        formatted += ' ' + cleanPAN.substring(9, 10);
      }
    } else if (cleanPAN.length > 5) {
      formatted += ' ' + cleanPAN.substring(5);
    }
    return formatted;
  }
  
  return cleanPAN;
};

export const isPANValid = (pan: string): boolean => {
  return validatePAN(pan).isValid;
};