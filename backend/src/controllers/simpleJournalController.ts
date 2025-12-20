import { Request, Response } from 'express';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import ChartOfAccount from '../models/ChartOfAccount';
import { determineCashFlowCategory, isNonCashTransaction } from '../utils/cashFlowHelper';
import mongoose from 'mongoose';

export const createJournalEntry = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const journalData = { ...req.body, createdBy: req.user.id };
    const journalEntry = new JournalEntry(journalData);
    await journalEntry.save({ session });

    // Auto-create ledger entries with cash flow categories
    if (journalEntry.isPosted) {
      for (const line of journalEntry.lines) {
        const account = await ChartOfAccount.findById(line.account).session(session);
        if (!account) {
          throw new Error(`Account ${line.account} not found`);
        }

        let cashFlowCategory = undefined;
        let suggestedCategory = undefined;
        let categoryConfidence = undefined;
        let needsReview = false;
        
        // Determine category for cash accounts
        if (!isNonCashTransaction(journalEntry.description, journalEntry.sourceType)) {
          const result = await determineCashFlowCategory(
            line.account.toString(),
            journalEntry.description,
            journalEntry.sourceType,
            line.debit || line.credit
          );
          
          if (result) {
            cashFlowCategory = result.category;
            suggestedCategory = result.category;
            categoryConfidence = result.confidence;
            needsReview = result.needsReview;
          }
        } else {
          cashFlowCategory = 'NON_CASH';
          suggestedCategory = 'NON_CASH';
          categoryConfidence = 1.0;
          needsReview = false;
        }

        // Calculate new balance
        const prevBalance = account.balance || 0;
        const newBalance = prevBalance + line.debit - line.credit;

        await Ledger.create([{
          accountId: line.account,
          date: journalEntry.entryDate,
          description: line.description || journalEntry.description,
          debit: line.debit,
          credit: line.credit,
          balance: newBalance,
          journalEntryId: journalEntry._id,
          reference: journalEntry.reference || journalEntry.entryNumber,
          cashFlowCategory,
          suggestedCategory,
          categoryConfidence,
          needsReview
        }], { session });

        // Update account balance
        account.balance = newBalance;
        await account.save({ session });
      }
    }

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: journalEntry,
      message: 'Journal entry created successfully'
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      JournalEntry.find().sort({ date: -1 }).skip(skip).limit(Number(limit)),
      JournalEntry.countDocuments()
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJournalEntryById = async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
