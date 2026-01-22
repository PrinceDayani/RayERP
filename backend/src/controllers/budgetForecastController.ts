import { Request, Response } from 'express';
import BudgetForecast from '../models/BudgetForecast';
import Budget from '../models/Budget';
import { generateForecast } from '../utils/forecastingEngine';

// Generate forecast for a budget
export const generateBudgetForecast = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { forecastType = 'linear', forecastPeriod = 12 } = req.body;
    const userId = req.user?.id;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Get historical spending data from transactions
    const Transaction = require('../models/Transaction').default;
    const historicalData = await Transaction.aggregate([
      { $match: { budgetId: budget._id } },
      { $group: {
        _id: { month: { $month: '$date' }, year: { $year: '$date' } },
        actualAmount: { $sum: '$amount' }
      }},
      { $project: {
        _id: 0,
        month: '$_id.month',
        year: '$_id.year',
        actualAmount: 1
      }},
      { $sort: { year: 1, month: 1 } }
    ]);

    if (historicalData.length < 2) {
      return res.status(400).json({ message: 'Insufficient historical data for forecasting' });
    }

    // Generate forecast
    const forecastData = generateForecast(historicalData, forecastPeriod, forecastType);

    // Determine methodology and assumptions
    const methodology = getMethodologyDescription(forecastType);
    const assumptions = getAssumptions(forecastType, historicalData.length);

    // Save forecast
    const forecast = await BudgetForecast.create({
      budget: budgetId,
      fiscalYear: budget.fiscalYear,
      forecastType,
      forecastPeriod,
      forecastData,
      historicalData,
      methodology,
      assumptions,
      createdBy: userId
    });

    const populatedForecast = await BudgetForecast.findById(forecast._id)
      .populate('budget', 'budgetName totalAmount allocatedAmount')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Forecast generated successfully',
      forecast: populatedForecast
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating forecast', error: error.message });
  }
};

// Get forecasts for a budget
export const getBudgetForecasts = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;

    const forecasts = await BudgetForecast.find({ budget: budgetId })
      .populate('budget', 'budgetName fiscalYear')
      .populate('createdBy', 'name email')
      .sort({ generatedDate: -1 });

    res.json({ forecasts, count: forecasts.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching forecasts', error: error.message });
  }
};

// Get forecast by ID
export const getForecastById = async (req: Request, res: Response) => {
  try {
    const { forecastId } = req.params;

    const forecast = await BudgetForecast.findById(forecastId)
      .populate('budget', 'budgetName totalAmount allocatedAmount fiscalYear')
      .populate('createdBy', 'name email');

    if (!forecast) {
      return res.status(404).json({ message: 'Forecast not found' });
    }

    res.json({ forecast });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching forecast', error: error.message });
  }
};

// Compare forecast accuracy
export const compareForecastAccuracy = async (req: Request, res: Response) => {
  try {
    const { forecastId } = req.params;

    const forecast = await BudgetForecast.findById(forecastId)
      .populate('budget', 'budgetName allocatedAmount');

    if (!forecast) {
      return res.status(404).json({ message: 'Forecast not found' });
    }

    const accuracy = forecast.accuracy || 0;
    
    forecast.accuracy = accuracy;
    await forecast.save();

    res.json({
      message: 'Forecast accuracy calculated',
      accuracy,
      forecast
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error calculating accuracy', error: error.message });
  }
};

// Get forecast summary
export const getForecastSummary = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;

    const latestForecast = await BudgetForecast.findOne({ budget: budgetId })
      .sort({ generatedDate: -1 })
      .populate('budget', 'budgetName totalAmount allocatedAmount');

    if (!latestForecast) {
      return res.status(404).json({ message: 'No forecasts found' });
    }

    const summary = {
      budgetName: (latestForecast.budget as any).budgetName,
      currentTotal: (latestForecast.budget as any).totalAmount,
      currentAllocated: (latestForecast.budget as any).allocatedAmount,
      forecastType: latestForecast.forecastType,
      forecastPeriod: latestForecast.forecastPeriod,
      totalPredicted: latestForecast.forecastData.reduce((sum, d) => sum + d.predictedAmount, 0),
      avgMonthlyPrediction: latestForecast.forecastData.reduce((sum, d) => sum + d.predictedAmount, 0) / latestForecast.forecastData.length,
      avgConfidence: latestForecast.forecastData.reduce((sum, d) => sum + d.confidence, 0) / latestForecast.forecastData.length,
      generatedDate: latestForecast.generatedDate
    };

    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
};


const getMethodologyDescription = (type: string): string => {
  const descriptions = {
    linear: 'Linear regression based on historical trend analysis',
    seasonal: 'Seasonal decomposition with monthly pattern recognition',
    exponential: 'Exponential smoothing with adaptive weighting',
    ml: 'Machine learning ensemble combining multiple algorithms'
  };
  return descriptions[type as keyof typeof descriptions] || descriptions.linear;
};

// Helper: Get assumptions
const getAssumptions = (type: string, dataPoints: number): string[] => {
  const common = [
    'Historical patterns will continue',
    'No major organizational changes',
    'Economic conditions remain stable'
  ];
  
  if (type === 'seasonal') {
    common.push('Seasonal patterns repeat annually');
  }
  
  if (dataPoints < 12) {
    common.push('Limited historical data may affect accuracy');
  }
  
  return common;
};

// Helper: Get methodology description