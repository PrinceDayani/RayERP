'use client';

import { Button } from '@/components/ui/button';

export default function TestButton() {
  const handleClick = () => {
    console.log('Button clicked!');
    
    // Check API URL
    console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    // Check auth token
    const token = localStorage.getItem('auth-token');
    console.log('Auth token:', token ? 'Present' : 'Missing');
    
    // Test basic fetch
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => console.log('Health check:', data))
      .catch(err => console.error('Health check error:', err));
  };

  return (
    <Button onClick={handleClick} className="bg-red-500 hover:bg-red-600">
      🔧 Test Connection
    </Button>
  );
}