import { useState, useEffect } from 'react';
import axios from 'axios';

const cache = new Map();

export function useFastQuery<T>(url: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;

    // Check cache first
    if (cache.has(url)) {
      setData(cache.get(url));
      return;
    }

    setLoading(true);
    setError(null);

    axios.get(url)
      .then(response => {
        const result = response.data;
        setData(result);
        cache.set(url, result);
        
        // Auto-expire cache after 30 seconds
        setTimeout(() => cache.delete(url), 30000);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, enabled]);

  return { data, loading, error };
}
