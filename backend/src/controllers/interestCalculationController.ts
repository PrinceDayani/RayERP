import { Request, Response } from 'express';
import { InterestCalculation } from '../models/InterestCalculation';
import ChartOfAccount from '../models/ChartOfAccount';

const calculateSimpleInterest = (principal: number, rate: number, days: number) => {
  return (principal * rate * days) / (365 * 100);
};

const calculateCompoundInterest = (principal: number, rate: number, days: number, frequency: string) => {
  const n = frequency === 'daily' ? 365 : frequency === 'monthly' ? 12 : frequency === 'quarterly' ? 4 : 1;
  const t = days / 365;
  const amount = principal * Math.pow(1 + rate / (100 * n), n * t);
  return amount - principal;
};

const calculateEMI = (principal: number, rate: number, months: number) => {
  const monthlyRate = rate / (12 * 100);
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

const generateEMISchedule = (principal: number, rate: number, months: number, startDate: Date) => {
  const emi = calculateEMI(principal, rate, months);
  const schedule = [];
  let outstanding = principal;

  for (let i = 1; i <= months; i++) {
    const interestAmount = (outstanding * rate) / (12 * 100);
    const principalAmount = emi - interestAmount;
    outstanding -= principalAmount;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      principalAmount,
      interestAmount,
      totalEMI: emi,
      outstandingPrincipal: Math.max(0, outstanding),
      status: 'pending'
    });
  }

  return schedule;
};

const generateAccruals = (fromDate: Date, toDate: Date, totalInterest: number) => {
  const accruals = [];
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyAccrual = totalInterest / days;
  let cumulative = 0;

  const current = new Date(fromDate);
  while (current <= toDate) {
    cumulative += dailyAccrual;
    accruals.push({
      date: new Date(current),
      accruedAmount: dailyAccrual,
      cumulativeAccrued: cumulative
    });
    current.setDate(current.getDate() + 1);
  }

  return accruals;
};

export const createCalculation = async (req: Request, res: Response) => {
  try {
    const { accountId, calculationType, fromDate, toDate, principalAmount, interestRate, compoundingFrequency, tdsRate, gracePeriodDays, penaltyRate, loanMonths } = req.body;

    if (principalAmount <= 0 || interestRate <= 0) {
      return res.status(400).json({ success: false, message: 'Principal and interest rate must be positive' });
    }

    const days = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0 || days > 3650) {
      return res.status(400).json({ success: false, message: 'Invalid date range (max 10 years)' });
    }
    let interestAmount = 0;
    let effectiveRate = interestRate;
    let emiSchedule = undefined;

    if (calculationType === 'simple') {
      interestAmount = calculateSimpleInterest(principalAmount, interestRate, days);
    } else if (calculationType === 'compound') {
      interestAmount = calculateCompoundInterest(principalAmount, interestRate, days, compoundingFrequency);
      effectiveRate = (interestAmount / principalAmount) * (365 / days) * 100;
    } else if (calculationType === 'emi') {
      emiSchedule = generateEMISchedule(principalAmount, interestRate, loanMonths, new Date(fromDate));
      interestAmount = emiSchedule.reduce((sum, e) => sum + e.interestAmount, 0);
    } else if (calculationType === 'overdue') {
      const baseDays = Math.max(0, days - (gracePeriodDays || 0));
      interestAmount = calculateSimpleInterest(principalAmount, penaltyRate || interestRate, baseDays);
    }

    const accruals = generateAccruals(new Date(fromDate), new Date(toDate), interestAmount);

    let tdsDetails = undefined;
    if (tdsRate) {
      const tdsAmount = (interestAmount * tdsRate) / 100;
      tdsDetails = {
        tdsRate,
        tdsAmount,
        netInterest: interestAmount - tdsAmount,
        deductionDate: new Date(toDate)
      };
    }

    const calculation = await InterestCalculation.create({
      accountId,
      calculationType,
      fromDate,
      toDate,
      principalAmount,
      interestRate,
      compoundingFrequency,
      interestAmount,
      effectiveRate,
      accruals,
      tdsDetails,
      emiSchedule,
      gracePeriodDays,
      penaltyRate,
      createdBy: req.user._id
    });

    await calculation.populate('accountId createdBy');
    res.status(201).json({ success: true, data: calculation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCalculations = async (req: Request, res: Response) => {
  try {
    const { accountId, status, calculationType, fromDate, toDate } = req.query;
    const filter: any = {};
    if (accountId) filter.accountId = accountId;
    if (status) filter.status = status;
    if (calculationType) filter.calculationType = calculationType;
    if (fromDate && toDate) {
      filter.fromDate = { $gte: new Date(fromDate as string) };
      filter.toDate = { $lte: new Date(toDate as string) };
    }

    const calculations = await InterestCalculation.find(filter)
      .populate('accountId createdBy')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: calculations });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCalculationById = async (req: Request, res: Response) => {
  try {
    const calculation = await InterestCalculation.findById(req.params.id)
      .populate('accountId createdBy journalEntryId');
    
    if (!calculation) return res.status(404).json({ success: false, message: 'Calculation not found' });
    res.json({ success: true, data: calculation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const postCalculation = async (req: Request, res: Response) => {
  try {
    const calculation = await InterestCalculation.findById(req.params.id);
    if (!calculation) return res.status(404).json({ success: false, message: 'Calculation not found' });

    if (calculation.status === 'posted') {
      return res.status(400).json({ success: false, message: 'Already posted' });
    }

    calculation.status = 'posted';
    await calculation.save();

    res.json({ success: true, data: calculation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAccruals = async (req: Request, res: Response) => {
  try {
    const { accountId, fromDate, toDate } = req.query;
    
    const calculations = await InterestCalculation.find({
      accountId,
      status: 'accrued',
      fromDate: { $gte: new Date(fromDate as string) },
      toDate: { $lte: new Date(toDate as string) }
    }).populate('accountId');

    const allAccruals = calculations.flatMap(c => c.accruals);
    const totalAccrued = allAccruals.reduce((sum, a) => sum + a.accruedAmount, 0);

    res.json({ success: true, data: { accruals: allAccruals, totalAccrued } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const scheduleAutoCalculation = async (req: Request, res: Response) => {
  try {
    const { accountId, interestRate, calculationType, compoundingFrequency, scheduledDate } = req.body;

    const calculation = await InterestCalculation.create({
      accountId,
      calculationType,
      fromDate: new Date(),
      toDate: new Date(scheduledDate),
      principalAmount: 0,
      interestRate,
      compoundingFrequency,
      interestAmount: 0,
      autoCalculated: true,
      scheduledDate: new Date(scheduledDate),
      status: 'draft',
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: calculation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const runScheduledCalculations = async (req: Request, res: Response) => {
  try {
    const scheduled = await InterestCalculation.find({
      autoCalculated: true,
      status: 'draft',
      scheduledDate: { $lte: new Date() }
    }).populate('accountId');

    const results = [];
    for (const calc of scheduled) {
      const account = await ChartOfAccount.findById(calc.accountId);
      if (!account) continue;

      const days = Math.ceil((calc.toDate.getTime() - calc.fromDate.getTime()) / (1000 * 60 * 60 * 24));
      const principal = account.balance;
      
      let interestAmount = 0;
      if (calc.calculationType === 'simple') {
        interestAmount = calculateSimpleInterest(principal, calc.interestRate, days);
      } else if (calc.calculationType === 'compound') {
        interestAmount = calculateCompoundInterest(principal, calc.interestRate, days, calc.compoundingFrequency!);
      }

      calc.principalAmount = principal;
      calc.interestAmount = interestAmount;
      calc.status = 'posted';
      await calc.save();

      results.push(calc);
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEMIStatus = async (req: Request, res: Response) => {
  try {
    const { installmentNumber, status } = req.body;
    const calculation = await InterestCalculation.findById(req.params.id);
    
    if (!calculation) return res.status(404).json({ success: false, message: 'Calculation not found' });

    const installment = calculation.emiSchedule?.find(e => e.installmentNumber === installmentNumber);
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });

    installment.status = status;
    await calculation.save();

    res.json({ success: true, data: calculation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOverdueCalculations = async (req: Request, res: Response) => {
  try {
    const calculations = await InterestCalculation.find({
      calculationType: 'overdue',
      status: { $ne: 'posted' }
    }).populate('accountId');

    res.json({ success: true, data: calculations });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter: any = { status: 'posted' };
    if (fromDate && toDate) {
      filter.fromDate = { $gte: new Date(fromDate as string) };
      filter.toDate = { $lte: new Date(toDate as string) };
    }

    const calculations = await InterestCalculation.find(filter);
    
    const summary = {
      totalInterest: calculations.reduce((sum, c) => sum + c.interestAmount, 0),
      totalTDS: calculations.reduce((sum, c) => sum + (c.tdsDetails?.tdsAmount || 0), 0),
      netInterest: calculations.reduce((sum, c) => sum + (c.tdsDetails?.netInterest || c.interestAmount), 0),
      byType: {
        simple: calculations.filter(c => c.calculationType === 'simple').reduce((sum, c) => sum + c.interestAmount, 0),
        compound: calculations.filter(c => c.calculationType === 'compound').reduce((sum, c) => sum + c.interestAmount, 0),
        emi: calculations.filter(c => c.calculationType === 'emi').reduce((sum, c) => sum + c.interestAmount, 0),
        overdue: calculations.filter(c => c.calculationType === 'overdue').reduce((sum, c) => sum + c.interestAmount, 0)
      }
    };

    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCalculation = async (req: Request, res: Response) => {
  try {
    const calculation = await InterestCalculation.findById(req.params.id);
    if (!calculation) return res.status(404).json({ success: false, message: 'Calculation not found' });
    
    if (calculation.status === 'posted') {
      return res.status(400).json({ success: false, message: 'Cannot delete posted calculation' });
    }

    await calculation.deleteOne();
    res.json({ success: true, message: 'Calculation deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

