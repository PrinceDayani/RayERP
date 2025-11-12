// Debug utility to help troubleshoot API issues
export const debugApiCall = async (url: string, options: RequestInit = {}) => {
  console.log('🔍 API Debug Info:');
  console.log('URL:', url);
  console.log('Options:', options);
  
  const token = localStorage.getItem('auth-token');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
  
  try {
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};