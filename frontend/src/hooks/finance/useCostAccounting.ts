import { useState } from 'react';

export const useCostAccounting = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCostCenters = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setCostCenters([]);
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      setCostCenters([]);
    } finally {
      setLoading(false);
    }
  };

  return { costCenters, loading, fetchCostCenters };
};