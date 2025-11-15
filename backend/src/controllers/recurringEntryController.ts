import { Request, Response } from 'express';
import { RecurringEntry } from '../models/RecurringEntry';
import JournalEntry from '../models/JournalEntry';
import { logger } from '../utils/logger';

const calculateNextRunDate = (startDate: Date, frequency: string): Date => {
  const next = new Date(startDate);
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
};

export const createRecurringEntry = async (req: Request, res: Response) => {
  try {
    const { name, description, frequency, startDate, endDate, entries } = req.body;
    const userId = (req as any).user?.id;

    const totalDebit = entries.reduce((sum: number, e: any) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum: number, e: any) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'Debits must equal credits' });
    }

    const nextRunDate = calculateNextRunDate(new Date(startDate), frequency);

    const recurringEntry = await RecurringEntry.create({
      name,
      description,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      nextRunDate,
      entries,
      createdBy: userId
    });

    res.status(201).json({ success: true, data: recurringEntry });
  } catch (error) {
    logger.error('Create recurring entry error:', error);
    res.status(500).json({ message: 'Error creating recurring entry' });
  }
};

export const getRecurringEntries = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    const query: any = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const entries = await RecurringEntry.find(query)
      .populate('entries.accountId', 'code name')
      .populate('createdBy', 'name email')
      .sort({ nextRunDate: 1 });

    res.json({ success: true, data: entries });
  } catch (error) {
    logger.error('Get recurring entries error:', error);
    res.status(500).json({ message: 'Error fetching recurring entries' });
  }
};

export const updateRecurringEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.entries) {
      const totalDebit = updates.entries.reduce((sum: number, e: any) => sum + e.debit, 0);
      const totalCredit = updates.entries.reduce((sum: number, e: any) => sum + e.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ message: 'Debits must equal credits' });
      }
    }

    const entry = await RecurringEntry.findByIdAndUpdate(id, updates, { new: true })
      .populate('entries.accountId', 'code name');

    if (!entry) {
      return res.status(404).json({ message: 'Recurring entry not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('Update recurring entry error:', error);
    res.status(500).json({ message: 'Error updating recurring entry' });
  }
};

export const deleteRecurringEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await RecurringEntry.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({ message: 'Recurring entry not found' });
    }

    res.json({ success: true, message: 'Recurring entry deleted' });
  } catch (error) {
    logger.error('Delete recurring entry error:', error);
    res.status(500).json({ message: 'Error deleting recurring entry' });
  }
};

export const processRecurringEntries = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const entries = await RecurringEntry.find({
      isActive: true,
      nextRunDate: { $lte: today },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }]
    }).populate('entries.accountId');

    const processed = [];

    for (const entry of entries) {
      const journalEntry = await JournalEntry.create({
        date: today,
        description: `${entry.name} - Auto-generated`,
        reference: `REC-${entry._id}`,
        entries: entry.entries.map(e => ({
          accountId: e.accountId,
          debit: e.debit,
          credit: e.credit,
          description: e.description
        })),
        createdBy: entry.createdBy,
        status: 'posted'
      });

      entry.lastRunDate = today;
      entry.nextRunDate = calculateNextRunDate(today, entry.frequency);
      await entry.save();

      processed.push({ recurringEntry: entry._id, journalEntry: journalEntry._id });
    }

    res.json({ success: true, processed: processed.length, data: processed });
  } catch (error) {
    logger.error('Process recurring entries error:', error);
    res.status(500).json({ message: 'Error processing recurring entries' });
  }
};
