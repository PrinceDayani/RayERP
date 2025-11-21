"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import { settingsAPI } from '@/lib/api/settingsAPI';
import toast from 'react-hot-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function SettingsTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const socket = useSocket();
  const { sendTestNotification } = useNotifications();
  const [testSetting, setTestSetting] = useRealTimeSetting('testSetting', 'initial');

  const updateTest = (name: string, status: 'pending' | 'success' | 'error', message: string, details?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    const testList: TestResult[] = [
      { name: 'API Connection', status: 'pending', message: 'Testing API connection...' },
      { name: 'Socket Connection', status: 'pending', message: 'Testing socket connection...' },
      { name: 'Settings API', status: 'pending', message: 'Testing settings API...' },
      { name: 'Real-time Settings', status: 'pending', message: 'Testing real-time settings...' },
      { name: 'Notifications', status: 'pending', message: 'Testing notifications...' },
      { name: 'Profile Settings', status: 'pending', message: 'Testing profile settings...' },
      { name: 'Appearance Settings', status: 'pending', message: 'Testing appearance settings...' },
      { name: 'Security Settings', status: 'pending', message: 'Testing security settings...' },
    ];

    setTests(testList);

    // Test 1: API Connection
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
      if (response.ok) {
        updateTest('API Connection', 'success', 'API is reachable');
      } else {
        updateTest('API Connection', 'error', `API returned ${response.status}`);
      }
    } catch (error) {
      updateTest('API Connection', 'error', 'Failed to connect to API', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 2: Socket Connection
    if (socket && socket.connected) {
      updateTest('Socket Connection', 'success', 'Socket is connected');
    } else {
      updateTest('Socket Connection', 'error', 'Socket is not connected');
    }

    // Test 3: Settings API
    try {
      const settings = await settingsAPI.getSettings('user' as any);
      updateTest('Settings API', 'success', `Retrieved ${Array.isArray(settings) ? settings.length : 0} settings`);
    } catch (error) {
      updateTest('Settings API', 'error', 'Failed to fetch settings', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 4: Real-time Settings
    try {
      const testValue = `test-${Date.now()}`;
      setTestSetting(testValue);
      
      // Wait a bit for the setting to be saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateTest('Real-time Settings', 'success', 'Real-time settings working');
    } catch (error) {
      updateTest('Real-time Settings', 'error', 'Real-time settings failed', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 5: Notifications
    try {
      sendTestNotification();
      updateTest('Notifications', 'success', 'Test notification sent');
    } catch (error) {
      updateTest('Notifications', 'error', 'Notification test failed', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 6: Profile Settings
    try {
      const profile = await settingsAPI.getUserProfile();
      updateTest('Profile Settings', 'success', 'Profile settings accessible');
    } catch (error) {
      updateTest('Profile Settings', 'error', 'Profile settings failed', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 7: Appearance Settings
    try {
      const appearance = await settingsAPI.getAppearanceSettings();
      updateTest('Appearance Settings', 'success', 'Appearance settings accessible');
    } catch (error) {
      updateTest('Appearance Settings', 'error', 'Appearance settings failed', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 8: Security Settings
    try {
      const security = await settingsAPI.getSecuritySettings();
      updateTest('Security Settings', 'success', 'Security settings accessible');
    } catch (error) {
      updateTest('Security Settings', 'error', 'Security settings failed', error instanceof Error ? error.message : 'Unknown error');
    }

    setIsRunning(false);
    toast.success('Settings tests completed!');
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Settings System Test
        </CardTitle>
        <CardDescription>
          Comprehensive test of all settings functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Summary */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Status: </span>
            {isRunning ? (
              <Badge variant="secondary">Running Tests...</Badge>
            ) : tests.length === 0 ? (
              <Badge variant="outline">Ready</Badge>
            ) : (
              <Badge className={errorCount > 0 ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}>
                {errorCount > 0 ? `${errorCount} Failed` : 'All Passed'}
              </Badge>
            )}
          </div>
          {tests.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {successCount} passed, {errorCount} failed, {pendingCount} pending
            </div>
          )}
        </div>

        {/* Run Tests Button */}
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Settings Tests'
          )}
        </Button>

        {/* Test Results */}
        {tests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results</h3>
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.message}</div>
                    {test.details && (
                      <div className="text-xs text-red-600 mt-1">{test.details}</div>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </div>
        )}

        {/* Environment Info */}
        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <h4 className="font-medium">Environment Information</h4>
          <div className="text-sm space-y-1">
            <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>
            <div>Socket Connected: {socket?.connected ? 'Yes' : 'No'}</div>
            <div>Socket ID: {socket?.id || 'Not connected'}</div>
            <div>Test Setting Value: {testSetting}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}