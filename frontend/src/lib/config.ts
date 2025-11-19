// Environment configuration utility
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:5000',
  
  // Socket Configuration
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature Flags
  enableSocket: process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'true',
  enableRealTime: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME !== 'false',
  
  // Validation
  validate() {
    if (!this.apiUrl) {
      throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
    }
    
    console.log(`🔗 API URL: ${this.apiUrl}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    return true;
  }
};

// Validate configuration on import
config.validate();

export default config;