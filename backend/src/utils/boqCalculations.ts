import { IBOQ, IBOQItem } from '../models/BOQ';

export interface IVarianceAnalysis {
  itemCode: string;
  description: string;
  plannedQuantity: number;
  actualQuantity: number;
  quantityVariance: number;
  quantityVariancePercentage: number;
  plannedAmount: number;
  actualAmount: number;
  costVariance: number;
  costVariancePercentage: number;
  status: 'under-budget' | 'on-budget' | 'over-budget';
}

export interface ICostForecast {
  totalPlannedCost: number;
  totalActualCost: number;
  completionPercentage: number;
  estimatedCostAtCompletion: number;
  costVariance: number;
  costVariancePercentage: number;
  estimatedCostToComplete: number;
  performanceIndex: number;
}

export const calculateItemProgress = (item: IBOQItem): number => {
  if (!item.plannedQuantity || item.plannedQuantity <= 0 || !isFinite(item.plannedQuantity)) return 0;
  if (!item.actualQuantity || item.actualQuantity < 0 || !isFinite(item.actualQuantity)) return 0;
  return Math.min((item.actualQuantity / item.plannedQuantity) * 100, 100);
};

export const calculateItemAmount = (quantity: number, unitRate: number): number => {
  if (!isFinite(quantity) || !isFinite(unitRate) || quantity < 0 || unitRate < 0) return 0;
  return quantity * unitRate;
};

export const calculateOverallProgress = (items: IBOQItem[]): number => {
  if (!items || items.length === 0) return 0;
  
  const totalWeight = items.reduce((sum, item) => sum + item.plannedAmount, 0);
  if (totalWeight === 0) return 0;
  
  return items.reduce((sum, item) => {
    const weight = item.plannedAmount / totalWeight;
    return sum + (item.completionPercentage * weight);
  }, 0);
};

export const analyzeVariance = (items: IBOQItem[]): IVarianceAnalysis[] => {
  return items.map(item => {
    const quantityVariance = item.actualQuantity - item.plannedQuantity;
    const quantityVariancePercentage = item.plannedQuantity > 0 
      ? (quantityVariance / item.plannedQuantity) * 100 
      : 0;
    
    const costVariance = item.actualAmount - item.plannedAmount;
    const costVariancePercentage = item.plannedAmount > 0 
      ? (costVariance / item.plannedAmount) * 100 
      : 0;
    
    let status: 'under-budget' | 'on-budget' | 'over-budget' = 'on-budget';
    if (costVariancePercentage < -5) status = 'under-budget';
    else if (costVariancePercentage > 5) status = 'over-budget';
    
    return {
      itemCode: item.itemCode,
      description: item.description,
      plannedQuantity: item.plannedQuantity,
      actualQuantity: item.actualQuantity,
      quantityVariance,
      quantityVariancePercentage,
      plannedAmount: item.plannedAmount,
      actualAmount: item.actualAmount,
      costVariance,
      costVariancePercentage,
      status
    };
  });
};

export const forecastCostToComplete = (boq: IBOQ): ICostForecast => {
  const totalPlannedCost = boq.totalPlannedAmount;
  const totalActualCost = boq.totalActualAmount;
  const completionPercentage = boq.overallProgress;
  
  let estimatedCostAtCompletion = totalPlannedCost;
  let performanceIndex = 1;
  
  if (completionPercentage > 0 && totalPlannedCost > 0 && totalActualCost > 0) {
    const costRatio = totalActualCost / totalPlannedCost;
    const progressRatio = completionPercentage / 100;
    
    if (costRatio > 0 && isFinite(costRatio)) {
      performanceIndex = progressRatio / costRatio;
      
      if (performanceIndex > 0 && isFinite(performanceIndex)) {
        estimatedCostAtCompletion = totalPlannedCost / performanceIndex;
      }
    }
  }
  
  const costVariance = totalPlannedCost - estimatedCostAtCompletion;
  const costVariancePercentage = totalPlannedCost > 0 
    ? (costVariance / totalPlannedCost) * 100 
    : 0;
  
  const estimatedCostToComplete = Math.max(estimatedCostAtCompletion - totalActualCost, 0);
  
  return {
    totalPlannedCost,
    totalActualCost,
    completionPercentage,
    estimatedCostAtCompletion,
    costVariance,
    costVariancePercentage,
    estimatedCostToComplete,
    performanceIndex
  };
};

export const calculateMilestoneProgress = (
  items: IBOQItem[], 
  milestoneId: string
): number => {
  const milestoneItems = items.filter(item => 
    item.milestone?.toString() === milestoneId
  );
  
  if (milestoneItems.length === 0) return 0;
  
  return calculateOverallProgress(milestoneItems);
};

export const getCategoryBreakdown = (items: IBOQItem[]) => {
  const categories = ['material', 'labor', 'equipment', 'subcontractor', 'other'];
  
  return categories.map(category => {
    const categoryItems = items.filter(item => item.category === category);
    const plannedAmount = categoryItems.reduce((sum, item) => sum + item.plannedAmount, 0);
    const actualAmount = categoryItems.reduce((sum, item) => sum + item.actualAmount, 0);
    const progress = calculateOverallProgress(categoryItems);
    
    return {
      category,
      itemCount: categoryItems.length,
      plannedAmount,
      actualAmount,
      variance: actualAmount - plannedAmount,
      variancePercentage: plannedAmount > 0 ? ((actualAmount - plannedAmount) / plannedAmount) * 100 : 0,
      progress
    };
  });
};

export const validateBOQItem = (item: Partial<IBOQItem>): string[] => {
  const errors: string[] = [];
  
  if (!item.itemCode || item.itemCode.trim() === '') {
    errors.push('Item code is required');
  }
  
  if (!item.description || item.description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (!item.category) {
    errors.push('Category is required');
  }
  
  if (!item.unit || item.unit.trim() === '') {
    errors.push('Unit is required');
  }
  
  if (item.plannedQuantity === undefined || item.plannedQuantity < 0 || !isFinite(item.plannedQuantity)) {
    errors.push('Planned quantity must be a valid number >= 0');
  }
  
  if (item.unitRate === undefined || item.unitRate < 0 || !isFinite(item.unitRate)) {
    errors.push('Unit rate must be a valid number >= 0');
  }
  
  if (item.actualQuantity !== undefined && (item.actualQuantity < 0 || !isFinite(item.actualQuantity))) {
    errors.push('Actual quantity must be a valid number >= 0');
  }
  
  return errors;
};
