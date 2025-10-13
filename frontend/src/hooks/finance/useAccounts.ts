import { useState } from 'react';

export const useAccounts = () => {
  const [clientAccounts, setClientAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClientAccounts = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setClientAccounts([]);
    } catch (error) {
      console.error('Error fetching client accounts:', error);
      setClientAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  return { clientAccounts, loading, fetchClientAccounts };
};