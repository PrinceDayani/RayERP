import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Server } from 'lucide-react';

const BackendStatus: React.FC = () => {
  const { backendAvailable, error } = useAuth();

  if (backendAvailable) {
    return null; // Don't show anything if backend is available
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
        <Server className="h-4 w-4" />
        <div>
          <strong>Backend Server Not Available</strong>
          <p className="text-sm mt-1">
            {error || 'Cannot connect to the backend server. Please ensure it is running on http://localhost:5000'}
          </p>
          <p className="text-sm mt-2">
            To start the backend server, run: <code className="bg-gray-100 px-1 rounded">npm run dev</code> in the backend directory
          </p>
        </div>
    </Alert>
  );
};

export default BackendStatus;