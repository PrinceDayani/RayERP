import { useState } from 'react';
import { financeApi } from '@/lib/api/financeApi';

export const useFinance = () => {
  const [dashboard, setDashboard] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      const data = await financeApi.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching finance dashboard:', error);
      setDashboard({ summary: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0, totalRevenue: 0, totalExpenses: 0, netIncome: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await financeApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching finance settings:', error);
      setSettings({});
    }
  };

  const updateSummary = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await financeApi.updateSummary();
      setDashboard(data);
    } catch (error) {
      console.error('Error updating finance summary:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    dashboard, 
    settings, 
    loading, 
    fetchDashboard, 
    fetchSettings, 
    updateSummary 
  };
};