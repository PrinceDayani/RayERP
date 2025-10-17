// Suppress warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Missing `Description` or `aria-describedby`') ||
      message.includes('DialogContent')
    )) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Socket connection error') ||
      message.includes('xhr poll error') ||
      message.includes('Account code already exists') ||
      message.includes('Failed to load resource') ||
      message.includes('400 (Bad Request)')
    )) {
      return;
    }
    originalError.apply(console, args);
  };
}

export {};