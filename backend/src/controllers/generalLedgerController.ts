import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { Transaction } from '../models/Transaction';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Get all accounts with hierarchy
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { type, isGroup, includeInactive, hierarchy } = req.query;
    
    const query: any = {};
    if (type) query.type = type;
    if (isGroup !== undefined) query.isGroup = isGroup === 'true';
    if (includeInactive !== 'true') query.isActive = true;
    
    const accounts = await Account.find(query)
      .populate('parentId', 'name code type')
      .lean()
      .sort({ code: 1 });
    
    // Build hierarchy if requested
    if (hierarchy === 'true') {
      const accountMap = new Map();
      const rootAccounts: any[] = [];
      
      accounts.forEach(acc => {
        accountMap.set(acc._id.toString(), { ...acc, children: [] });
      });
      
      accounts.forEach(acc => {
        const account = accountMap.get(acc._id.toString());
        if (acc.parentId && typeof acc.parentId === 'object') {
          const parentId = (acc.parentId as any)._id?.toString() || acc.parentId.toString();
          const parent = accountMap.get(parentId);
          if (parent) {
            parent.children.push(account);
          } else {
            rootAccounts.push(account);
          }
        } else if (acc.parentId) {
          const parent = accountMap.get(acc.parentId.toString());
          if (parent) {
            parent.children.push(account);
          } else {
            rootAccounts.push(account);
          }
        } else {
          rootAccounts.push(account);
        }
      });
      
      return res.json({ accounts: rootAccounts, total: accounts.length });
    }
    
    res.json({ accounts, total: accounts.length });
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({ 
      message: 'Error fetching accounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new account
export const createAccount = async (req: Request, res: Response) => {
  try {
    console.log('=== CREATE ACCOUNT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const accountData = req.body;
    const userId = (req as any).user?.id || (req as any).user?._id;
    console.log('User ID:', userId);

    // Validate required fields
    if (!accountData.name || !accountData.code || !accountData.type) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'code', 'type']
      });
    }
    console.log('Validation passed');

    // Check if account code already exists
    const existingAccount = await Account.findOne({ code: accountData.code });
    if (existingAccount) {
      return res.status(400).json({ message: 'Account code already exists' });
    }

    // Calculate level based on parent
    let level = 0;
    let parentType = accountData.type;
    if (accountData.parentId) {
      const parent = await Account.findById(accountData.parentId);
      if (parent) {
        level = parent.level + 1;
        parentType = parent.type;
        // Inherit type from parent if not specified
        if (!accountData.type) {
          accountData.type = parent.type;
        }
      } else {
        return res.status(400).json({ message: 'Parent account not found' });
      }
    }

    const accountDoc: any = {
      name: accountData.name,
      code: accountData.code,
      type: accountData.type || parentType,
      subType: accountData.subType || '',
      category: accountData.category || '',
      level,
      balance: accountData.openingBalance || accountData.balance || 0,
      openingBalance: accountData.openingBalance || 0,
      currency: accountData.currency || 'INR',
      parentId: accountData.parentId || undefined,
      isActive: accountData.isActive !== undefined ? accountData.isActive : true,
      isGroup: accountData.isGroup || false,
      description: accountData.description || ''
    };

    // Only add createdBy if userId exists
    if (userId) {
      accountDoc.createdBy = userId;
    }

    console.log('Creating account with document:', JSON.stringify(accountDoc, null, 2));
    const account = new Account(accountDoc);
    console.log('Account model created, attempting to save...');
    await account.save();
    console.log('Account saved successfully:', account._id);
    
    if (account.parentId) {
      await account.populate('parentId', 'name code');
    }
    
    res.status(201).json(account);
  } catch (error) {
    console.error('=== ERROR CREATING ACCOUNT ===');
    console.error('Error type:', error instanceof Error ? error.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Full error:', error);
    
    logger.error('Error creating account:', error);
    res.status(500).json({ 
      message: 'Error creating account', 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error && error.name === 'ValidationError' ? (error as any).errors : undefined,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
};

// Update account
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const account = await Account.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('parentId', 'name code');

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    logger.error('Error updating account:', error);
    res.status(500).json({ message: 'Error updating account' });
  }
};

// Get journal entries
export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    const query: any = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const journalEntries = await JournalEntry.find(query)
      .populate('lines.accountId', 'code name')
      .populate('createdBy', 'name email')
      .sort({ date: -1, entryNumber: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await JournalEntry.countDocuments(query);

    res.json({
      journalEntries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Error fetching journal entries' });
  }
};

// Create journal entry
export const createJournalEntry = async (req: Request, res: Response) => {
  try {
    const { date, reference, description, lines } = req.body;
    const userId = (req as any).user?.id || '507f1f77bcf86cd799439011';

    // Generate entry number
    const lastEntry = await JournalEntry.findOne().sort({ entryNumber: -1 });
    const nextNumber = lastEntry 
      ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 
      : 1;
    const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

    const journalEntry = new JournalEntry({
      entryNumber,
      date: new Date(date),
      reference,
      description,
      lines,
      createdBy: userId
    });

    await journalEntry.save();
    await journalEntry.populate([
      { path: 'lines.accountId', select: 'code name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json(journalEntry);
  } catch (error) {
    logger.error('Error creating journal entry:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error creating journal entry' 
    });
  }
};

// Post journal entry (update account balances and create ledger entries)
export const postJournalEntry = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;

    const journalEntry = await JournalEntry.findById(id).session(session);
    if (!journalEntry) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (journalEntry.isPosted) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Journal entry already posted' });
    }

    // Process each journal line
    for (const line of journalEntry.lines) {
      const account = await Account.findById(line.accountId).session(session);
      if (!account) continue;

      // Calculate new balance
      let newBalance = account.balance;
      if (['asset', 'expense'].includes(account.type)) {
        newBalance += line.debit - line.credit;
      } else {
        newBalance += line.credit - line.debit;
      }

      // Update account balance
      await Account.findByIdAndUpdate(
        line.accountId,
        { balance: newBalance },
        { session }
      );

      // Create ledger entry
      await Ledger.create([{
        accountId: line.accountId,
        date: journalEntry.date,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
        balance: newBalance,
        journalEntryId: journalEntry._id,
        reference: journalEntry.reference
      }], { session });
    }

    // Mark journal entry as posted
    journalEntry.isPosted = true;
    await journalEntry.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Journal entry posted successfully' });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error posting journal entry:', error);
    res.status(500).json({ message: 'Error posting journal entry' });
  } finally {
    session.endSession();
  }
};

// Get trial balance
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const dateFilter = asOfDate ? new Date(asOfDate as string) : new Date();
    
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
    
    const trialBalance = accounts.map(account => {
      // For normal balance calculation based on account type
      let debit = 0, credit = 0;
      
      if (['asset', 'expense'].includes(account.type)) {
        if (account.balance >= 0) {
          debit = account.balance;
        } else {
          credit = Math.abs(account.balance);
        }
      } else {
        if (account.balance >= 0) {
          credit = account.balance;
        } else {
          debit = Math.abs(account.balance);
        }
      }
      
      return {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit
      };
    });

    const totalDebits = trialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredits = trialBalance.reduce((sum, item) => sum + item.credit, 0);

    res.json({
      accounts: trialBalance,
      totals: {
        debits: totalDebits,
        credits: totalCredits,
        balanced: Math.abs(totalDebits - totalCredits) < 0.01
      },
      asOfDate: dateFilter
    });
  } catch (error) {
    logger.error('Error generating trial balance:', error);
    res.status(500).json({ message: 'Error generating trial balance' });
  }
};

// Get account ledger
export const getAccountLedger = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const query: any = { accountId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const ledgerEntries = await Ledger.find(query)
      .populate('journalEntryId', 'entryNumber reference')
      .sort({ date: 1, createdAt: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Ledger.countDocuments(query);

    res.json({
      account: {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
        currentBalance: account.balance
      },
      entries: ledgerEntries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching account ledger:', error);
    res.status(500).json({ message: 'Error fetching account ledger' });
  }
};

// Generate financial reports
export const getFinancialReports = async (req: Request, res: Response) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    
    const dateFilter = {
      $gte: new Date(startDate as string || new Date().getFullYear() + '-01-01'),
      $lte: new Date(endDate as string || new Date())
    };

    switch (reportType) {
      case 'profit-loss':
        const revenueAccounts = await Account.find({ type: 'revenue', isActive: true });
        const expenseAccounts = await Account.find({ type: 'expense', isActive: true });
        
        const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        res.json({
          reportType: 'Profit & Loss Statement',
          period: { startDate, endDate },
          revenue: {
            accounts: revenueAccounts,
            total: totalRevenue
          },
          expenses: {
            accounts: expenseAccounts,
            total: totalExpenses
          },
          netIncome: totalRevenue - totalExpenses
        });
        break;
        
      case 'balance-sheet':
        const assets = await Account.find({ type: 'asset', isActive: true });
        const liabilities = await Account.find({ type: 'liability', isActive: true });
        const equity = await Account.find({ type: 'equity', isActive: true });
        
        const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
        const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
        
        res.json({
          reportType: 'Balance Sheet',
          asOfDate: endDate,
          assets: {
            accounts: assets,
            total: totalAssets
          },
          liabilities: {
            accounts: liabilities,
            total: totalLiabilities
          },
          equity: {
            accounts: equity,
            total: totalEquity
          },
          totalLiabilitiesAndEquity: totalLiabilities + totalEquity
        });
        break;
        
      default:
        res.status(400).json({ message: 'Invalid report type' });
    }
  } catch (error) {
    logger.error('Error generating financial report:', error);
    res.status(500).json({ message: 'Error generating financial report' });
  }
};

// Auto-create journal entry from transaction
export const createTransactionJournal = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { transactionType, transactionId, amount, lines, metadata } = req.body;
    const userId = (req as any).user?.id || '507f1f77bcf86cd799439011';

    // Generate entry number
    const lastEntry = await JournalEntry.findOne().sort({ entryNumber: -1 }).session(session);
    const nextNumber = lastEntry 
      ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 
      : 1;
    const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

    // Create journal entry
    const journalEntry = await JournalEntry.create([{
      entryNumber,
      date: new Date(),
      reference: transactionId,
      description: `Auto-generated from ${transactionType} ${transactionId}`,
      lines,
      createdBy: userId
    }], { session });

    // Create transaction link
    await Transaction.create([{
      transactionType,
      transactionId,
      journalEntryId: journalEntry[0]._id,
      amount,
      status: 'posted',
      metadata
    }], { session });

    await session.commitTransaction();
    res.status(201).json({
      journalEntry: journalEntry[0],
      message: 'Transaction journal entry created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error creating transaction journal:', error);
    res.status(500).json({ message: 'Error creating transaction journal' });
  } finally {
    session.endSession();
  }
};