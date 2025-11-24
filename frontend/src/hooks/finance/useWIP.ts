import { useState } from 'react';

export const useWIP = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setWorkOrders([]);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return { workOrders, loading, fetchWorkOrders };
};
