import { Request, Response } from 'express';
import { Account } from '../models/Account';
import JournalEntry from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface IPeriodClosing extends mongoose.Document {
  periodType: 'month' | 'quarter' | 'year';
  periodStart: Date;
  periodEnd: Date;
  closedBy: mongoose.Types.ObjectId;
  closedAt: Date;
  status: 'open' | 'closed' | 'locked';
  closingEntryId?: mongoose.Types.ObjectId;
  notes?: string;
}

const PeriodClosingSchema = new mongoose.Schema<IPeriodClosing>({
  periodType: { type: String, enum: ['month', 'quarter', 'year'], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  closedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['open', 'closed', 'locked'], default: 'closed' },
  closingEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: String
}, { timestamps: true });

const PeriodClosing = mongoose.model<IPeriodClosing>('PeriodClosing', PeriodClosingSchema);

export const closePeriod = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { periodType, periodStart, periodEnd, notes } = req.body;
    const userId = (req as any).user?.id;

    const existing = await PeriodClosing.findOne({
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: { $in: ['closed', 'locked'] }
    });

    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Period already closed' });
    }

    const revenueAccounts = await Account.find({ type: 'revenue', isActive: true });
    const expenseAccounts = await Account.find({ type: 'expense', isActive: true });

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    const retainedEarningsAccount = await Account.findOne({ code: '3200' });
    if (!retainedEarningsAccount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Retained Earnings account not found' });
    }

    const lastEntry = await JournalEntry.findOne().sort({ entryNumber: -1 }).session(session);
    const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 : 1;
    const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

    const closingLines = [
      ...revenueAccounts.map(acc => ({
        accountId: acc._id,
        debit: acc.balance,
        credit: 0,
        description: `Close ${acc.name} for period ending ${periodEnd}`
      })),
      ...expenseAccounts.map(acc => ({
        accountId: acc._id,
        debit: 0,
        credit: acc.balance,
        description: `Close ${acc.name} for period ending ${periodEnd}`
      })),
      {
        accountId: retainedEarningsAccount._id,
        debit: netIncome < 0 ? Math.abs(netIncome) : 0,
        credit: netIncome > 0 ? netIncome : 0,
        description: `Transfer net income to Retained Earnings`
      }
    ];

    const closingEntry = await JournalEntry.create([{
      entryNumber,
      date: new Date(periodEnd),
      reference: `CLOSING-${periodType.toUpperCase()}-${new Date(periodEnd).toISOString().slice(0, 7)}`,
      description: `Period closing entry for ${periodType} ending ${periodEnd}`,
      lines: closingLines,
      createdBy: userId,
      isPosted: true
    }], { session });

    for (const line of closingLines) {
      const account = await Account.findById(line.accountId).session(session);
      if (account) {
        if (['asset', 'expense'].includes(account.type)) {
          account.balance += line.debit - line.credit;
        } else {
          account.balance += line.credit - line.debit;
        }
        await account.save({ session });

        await Ledger.create([{
          accountId: line.accountId,
          date: new Date(periodEnd),
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          balance: account.balance,
          journalEntryId: closingEntry[0]._id,
          reference: closingEntry[0].reference
        }], { session });
      }
    }

    for (const acc of [...revenueAccounts, ...expenseAccounts]) {
      await Account.findByIdAndUpdate(acc._id, { balance: 0 }, { session });
    }

    const periodClosing = await PeriodClosing.create([{
      periodType,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      closedBy: userId,
      status: 'closed',
      closingEntryId: closingEntry[0]._id,
      notes
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Period closed successfully',
      data: {
        periodClosing: periodClosing[0],
        closingEntry: closingEntry[0],
        netIncome
      }
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error('Period closing error:', error);
    res.status(500).json({ message: 'Error closing period', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    session.endSession();
  }
};

export const getClosedPeriods = async (req: Request, res: Response) => {
  try {
    const { periodType, year } = req.query;
    const query: any = {};
    if (periodType) query.periodType = periodType;
    if (year) {
      query.periodStart = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const periods = await PeriodClosing.find(query)
      .populate('closedBy', 'name email')
      .populate('closingEntryId')
      .sort({ periodEnd: -1 });

    res.json({ success: true, data: periods });
  } catch (error) {
    logger.error('Get closed periods error:', error);
    res.status(500).json({ message: 'Error fetching closed periods' });
  }
};

export const lockPeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const period = await PeriodClosing.findByIdAndUpdate(
      id,
      { status: 'locked' },
      { new: true }
    );

    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }

    res.json({ success: true, message: 'Period locked successfully', data: period });
  } catch (error) {
    logger.error('Lock period error:', error);
    res.status(500).json({ message: 'Error locking period' });
  }
};

export const reopenPeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const period = await PeriodClosing.findById(id);

    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }

    if (period.status === 'locked') {
      return res.status(400).json({ message: 'Cannot reopen locked period' });
    }

    period.status = 'open';
    await period.save();

    res.json({ success: true, message: 'Period reopened successfully', data: period });
  } catch (error) {
    logger.error('Reopen period error:', error);
    res.status(500).json({ message: 'Error reopening period' });
  }
};
