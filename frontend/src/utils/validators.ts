export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
};

export const validateAccountCode = (code: string): boolean => {
  return /^[A-Z0-9]{3,10}$/.test(code);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const validatePAN = (pan: string): boolean => {
  if (!pan || typeof pan !== 'string') {
    return true; // Allow empty PAN
  }
  
  const cleanPAN = pan.trim().toUpperCase().replace(/\s/g, '');
  
  if (!cleanPAN) {
    return true; // Allow empty PAN
  }
  
  // PAN format: AAAAA9999A (5 letters + 4 digits + 1 letter)
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN);
};

export const validateGST = (gst: string): boolean => {
  if (!gst || typeof gst !== 'string') {
    return true; // Allow empty GST
  }
  
  const cleanGST = gst.trim().toUpperCase().replace(/\s/g, '');
  
  if (!cleanGST) {
    return true; // Allow empty GST
  }
  
  // GST format: 15 characters
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGST);
};

export const validateIFSC = (ifsc: string): boolean => {
  if (!ifsc || typeof ifsc !== 'string') {
    return true; // Allow empty IFSC
  }
  
  const cleanIFSC = ifsc.trim().toUpperCase().replace(/\s/g, '');
  
  if (!cleanIFSC) {
    return true; // Allow empty IFSC
  }
  
  // IFSC format: AAAA0NNNNNN (4 letters + 0 + 6 alphanumeric)
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC);
};
