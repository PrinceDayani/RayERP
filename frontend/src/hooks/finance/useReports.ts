import { useState } from 'react';

export const useReports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setReports(prev => ({ ...prev, balanceSheet: {} }));
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  return { reports, loading, fetchBalanceSheet };
};