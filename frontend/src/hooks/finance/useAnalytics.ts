import { useState } from 'react';

export const useAnalytics = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setKpis([]);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  return { kpis, loading, fetchKPIs };
};
