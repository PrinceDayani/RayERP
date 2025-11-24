// Real-time settings with auto-save and live updates
import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
});

class RealTimeSettings {
  private cache = new Map<string, any>();
  private saveTimeouts = new Map<string, NodeJS.Timeout>();
  private listeners = new Map<string, Set<(value: any) => void>>();

  // Auto-save after 500ms of no changes
  private autoSave(key: string, value: any, scope: string = 'user') {
    const timeoutKey = `${scope}-${key}`;
    
    if (this.saveTimeouts.has(timeoutKey)) {
      clearTimeout(this.saveTimeouts.get(timeoutKey)!);
    }

    this.saveTimeouts.set(timeoutKey, setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/settings`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ key, value, scope })
        });
        console.log(`Auto-saved ${key}`);
      } catch (error) {
        console.error(`Failed to auto-save ${key}:`, error);
      }
      this.saveTimeouts.delete(timeoutKey);
    }, 500));
  }

  // Get setting with real-time updates
  async get(key: string, scope: string = 'user', defaultValue: any = null) {
    const cacheKey = `${scope}-${key}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_URL}/api/settings?scope=${scope}&key=${key}&format=keyValue`, {
        headers: getAuthHeaders()
      });

      if (response.status === 404) {
        this.cache.set(cacheKey, defaultValue);
        return defaultValue;
      }

      if (!response.ok) throw new Error('Failed to fetch setting');

      const data = await response.json();
      const value = data[key] || defaultValue;
      this.cache.set(cacheKey, value);
      return value;
    } catch (error) {
      this.cache.set(cacheKey, defaultValue);
      return defaultValue;
    }
  }

  // Set setting with auto-save and real-time updates
  set(key: string, value: any, scope: string = 'user') {
    const cacheKey = `${scope}-${key}`;
    this.cache.set(cacheKey, value);
    
    // Notify listeners
    const listeners = this.listeners.get(cacheKey);
    if (listeners) {
      listeners.forEach(callback => callback(value));
    }

    // Auto-save
    this.autoSave(key, value, scope);
  }

  // Subscribe to setting changes
  subscribe(key: string, callback: (value: any) => void, scope: string = 'user') {
    const cacheKey = `${scope}-${key}`;
    
    if (!this.listeners.has(cacheKey)) {
      this.listeners.set(cacheKey, new Set());
    }
    
    this.listeners.get(cacheKey)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(cacheKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(cacheKey);
        }
      }
    };
  }

  // Bulk operations
  async getMultiple(keys: string[], scope: string = 'user') {
    const results: Record<string, any> = {};
    
    for (const key of keys) {
      results[key] = await this.get(key, scope);
    }
    
    return results;
  }

  setMultiple(settings: Record<string, any>, scope: string = 'user') {
    Object.entries(settings).forEach(([key, value]) => {
      this.set(key, value, scope);
    });
  }
}

export const realTimeSettings = new RealTimeSettings();

// React hook for real-time settings
export const useRealTimeSetting = (key: string, defaultValue: any = null, scope: string = 'user') => {
  const [value, setValue] = React.useState(defaultValue);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Load initial value
    realTimeSettings.get(key, scope, defaultValue).then(initialValue => {
      setValue(initialValue);
      setLoading(false);
    });

    // Subscribe to changes
    const unsubscribe = realTimeSettings.subscribe(key, setValue, scope);
    
    return unsubscribe;
  }, [key, scope, defaultValue]);

  const updateValue = React.useCallback((newValue: any) => {
    realTimeSettings.set(key, newValue, scope);
  }, [key, scope]);

  return [value, updateValue, loading] as const;
};

export default realTimeSettings;
