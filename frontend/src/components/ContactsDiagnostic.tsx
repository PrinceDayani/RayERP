'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Database, 
  Wifi, 
  User 
} from 'lucide-react';
import { checkContactsAPIHealth } from '@/lib/api/contactsAPI';
import api from '@/lib/api/api';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export default function ContactsDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // Check environment variables
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        diagnostics.push({
          name: 'Environment Configuration',
          status: 'success',
          message: `API URL configured: ${apiUrl}`,
        });
      } else {
        diagnostics.push({
          name: 'Environment Configuration',
          status: 'error',
          message: 'NEXT_PUBLIC_API_URL not configured',
          details: 'Check your .env.local file'
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Environment Configuration',
        status: 'error',
        message: 'Failed to check environment variables',
      });
    }

    // Check authentication token
    try {
      const token = localStorage.getItem('auth-token');
      if (token && token !== 'null' && token !== 'undefined') {
        diagnostics.push({
          name: 'Authentication',
          status: 'success',
          message: 'Auth token present',
        });
      } else {
        diagnostics.push({
          name: 'Authentication',
          status: 'warning',
          message: 'No auth token found',
          details: 'You may need to log in'
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Authentication',
        status: 'error',
        message: 'Failed to check auth token',
      });
    }

    // Check API connectivity
    try {
      const response = await api.get('/health');
      diagnostics.push({
        name: 'API Connectivity',
        status: 'success',
        message: 'Backend server is reachable',
      });
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        diagnostics.push({
          name: 'API Connectivity',
          status: 'error',
          message: 'Cannot connect to backend server',
          details: 'Check if backend is running on port 5000'
        });
      } else {
        diagnostics.push({
          name: 'API Connectivity',
          status: 'error',
          message: `API Error: ${error.message}`,
        });
      }
    }

    // Check contacts API specifically
    try {
      const isHealthy = await checkContactsAPIHealth();
      if (isHealthy) {
        diagnostics.push({
          name: 'Contacts API',
          status: 'success',
          message: 'Contacts API is working',
        });
      } else {
        diagnostics.push({
          name: 'Contacts API',
          status: 'error',
          message: 'Contacts API is not responding',
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'Contacts API',
        status: 'error',
        message: `Contacts API Error: ${error.message}`,
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">ERROR</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
      case 'loading':
        return <Badge className="bg-blue-100 text-blue-800">CHECKING</Badge>;
    }
  };

  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Contacts System Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            System health check for contact functionality
          </p>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run Check
          </Button>
        </div>

        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Critical issues detected. Contact functionality may not work properly.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasErrors && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some issues detected. Contact functionality may be limited.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <p className="font-medium">{result.name}</p>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground mt-1">{result.details}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(result.status)}
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Click "Run Check" to start diagnostics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}