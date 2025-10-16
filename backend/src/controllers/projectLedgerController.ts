//path: backend/src/controllers/projectLedgerController.ts

import { Request, Response } from 'express';
import ProjectJournalEntry, { IProjectJournalEntry } from '../models/ProjectLedger';
import { generateEntryNumber } from '../utils/numberGenerator';

// Get all journal entries for a project
export const getProjectJournalEntries = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, status } = req.query;

    let query: any = { projectId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (status) {
      query.status = status;
    }

    const entries = await ProjectJournalEntry.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Failed to fetch journal entries' });
  }
};

// Get a specific journal entry
export const getJournalEntryById = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const entry = await ProjectJournalEntry.findById(entryId)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'Failed to fetch journal entry' });
  }
};

// Create a new journal entry
export const createJournalEntry = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { date, reference, description, narration, lines } = req.body;
    const userId = req.user?.id;

    // Validate that debits equal credits
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        message: 'Journal entry must be balanced (Total Debits must equal Total Credits)' 
      });
    }

    // Generate entry number
    const entryNumber = await generateEntryNumber('JE');

    const journalEntry = new ProjectJournalEntry({
      projectId,
      entryNumber,
      date: new Date(date),
      reference,
      description,
      narration,
      lines,
      totalDebit,
      totalCredit,
      status: 'draft',
      createdBy: userId
    });

    await journalEntry.save();

    const populatedEntry = await ProjectJournalEntry.findById(journalEntry._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ message: 'Failed to create journal entry' });
  }
};

// Update a journal entry
export const updateJournalEntry = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const { date, reference, description, narration, lines } = req.body;

    const entry = await ProjectJournalEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Only allow updates if entry is in draft status
    if (entry.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft entries can be updated' 
      });
    }

    // Validate that debits equal credits
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        message: 'Journal entry must be balanced (Total Debits must equal Total Credits)' 
      });
    }

    entry.date = new Date(date);
    entry.reference = reference;
    entry.description = description;
    entry.narration = narration;
    entry.lines = lines;
    entry.totalDebit = totalDebit;
    entry.totalCredit = totalCredit;

    await entry.save();

    const populatedEntry = await ProjectJournalEntry.findById(entry._id)
      .populate('createdBy', 'name email');

    res.json(populatedEntry);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ message: 'Failed to update journal entry' });
  }
};

// Post a journal entry (change status from draft to posted)
export const postJournalEntry = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const entry = await ProjectJournalEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (entry.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft entries can be posted' 
      });
    }

    entry.status = 'posted';
    await entry.save();

    const populatedEntry = await ProjectJournalEntry.findById(entry._id)
      .populate('createdBy', 'name email');

    res.json(populatedEntry);
  } catch (error) {
    console.error('Error posting journal entry:', error);
    res.status(500).json({ message: 'Failed to post journal entry' });
  }
};

// Approve a journal entry
export const approveJournalEntry = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const userId = req.user?.id;

    const entry = await ProjectJournalEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (entry.status !== 'posted') {
      return res.status(400).json({ 
        message: 'Only posted entries can be approved' 
      });
    }

    entry.status = 'approved';
    entry.approvedBy = userId;
    entry.approvedAt = new Date();
    await entry.save();

    const populatedEntry = await ProjectJournalEntry.findById(entry._id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json(populatedEntry);
  } catch (error) {
    console.error('Error approving journal entry:', error);
    res.status(500).json({ message: 'Failed to approve journal entry' });
  }
};

// Delete a journal entry
export const deleteJournalEntry = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const entry = await ProjectJournalEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Only allow deletion if entry is in draft status
    if (entry.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft entries can be deleted' 
      });
    }

    await ProjectJournalEntry.findByIdAndDelete(entryId);
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ message: 'Failed to delete journal entry' });
  }
};

// Get ledger entries (derived from journal entries)
export const getProjectLedgerEntries = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { accountCode, startDate, endDate } = req.query;

    let query: any = { 
      projectId,
      status: { $in: ['posted', 'approved'] }
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const journalEntries = await ProjectJournalEntry.find(query).sort({ date: 1 });

    // Convert journal entries to ledger format
    const ledgerEntries: any[] = [];
    let runningBalances: { [key: string]: number } = {};

    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (!accountCode || line.accountCode === accountCode) {
          const balance = (runningBalances[line.accountCode] || 0) + line.debit - line.credit;
          runningBalances[line.accountCode] = balance;

          ledgerEntries.push({
            id: `${entry._id}-${line.accountCode}`,
            projectId: entry.projectId,
            date: entry.date,
            accountCode: line.accountCode,
            accountName: line.accountName,
            description: line.description || entry.description,
            voucherType: 'Journal Entry',
            voucherNumber: entry.entryNumber,
            debit: line.debit,
            credit: line.credit,
            balance: balance
          });
        }
      });
    });

    res.json(ledgerEntries);
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ message: 'Failed to fetch ledger entries' });
  }
};

// Get trial balance
export const getProjectTrialBalance = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { asOfDate } = req.query;

    let query: any = { 
      projectId,
      status: { $in: ['posted', 'approved'] }
    };

    if (asOfDate) {
      query.date = { $lte: new Date(asOfDate as string) };
    }

    const journalEntries = await ProjectJournalEntry.find(query);

    // Calculate account balances
    const accountBalances: { [key: string]: any } = {};

    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (!accountBalances[line.accountCode]) {
          accountBalances[line.accountCode] = {
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit: 0,
            credit: 0,
            balance: 0
          };
        }

        accountBalances[line.accountCode].debit += line.debit;
        accountBalances[line.accountCode].credit += line.credit;
        accountBalances[line.accountCode].balance += line.debit - line.credit;
      });
    });

    const accounts = Object.values(accountBalances);
    const totalDebits = accounts.reduce((sum: number, acc: any) => sum + acc.debit, 0);
    const totalCredits = accounts.reduce((sum: number, acc: any) => sum + acc.credit, 0);

    res.json({
      projectId,
      accounts,
      totalDebits,
      totalCredits
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ message: 'Failed to generate trial balance' });
  }
};