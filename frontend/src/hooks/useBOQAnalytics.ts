import { useQuery } from '@tanstack/react-query';
import { boqApi } from '@/lib/api/boq';

export const useBOQAnalytics = () => {
  // Get variance analysis
  const useVarianceAnalysis = (boqId: string) => {
    return useQuery({
      queryKey: ['boq-variance', boqId],
      queryFn: () => boqApi.getVarianceAnalysis(boqId),
      enabled: !!boqId
    });
  };

  // Get cost forecast
  const useCostForecast = (boqId: string) => {
    return useQuery({
      queryKey: ['boq-forecast', boqId],
      queryFn: () => boqApi.getCostForecast(boqId),
      enabled: !!boqId
    });
  };

  // Get milestone progress
  const useMilestoneProgress = (boqId: string, milestoneId: string) => {
    return useQuery({
      queryKey: ['boq-milestone-progress', boqId, milestoneId],
      queryFn: () => boqApi.getMilestoneProgress(boqId, milestoneId),
      enabled: !!boqId && !!milestoneId
    });
  };

  // Get category breakdown
  const useCategoryBreakdown = (boqId: string) => {
    return useQuery({
      queryKey: ['boq-category-breakdown', boqId],
      queryFn: () => boqApi.getCategoryBreakdown(boqId),
      enabled: !!boqId
    });
  };

  return {
    useVarianceAnalysis,
    useCostForecast,
    useMilestoneProgress,
    useCategoryBreakdown
  };
};
