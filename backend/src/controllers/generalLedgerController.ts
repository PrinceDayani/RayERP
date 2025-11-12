import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { AccountGroup } from '../models/AccountGroup';
import { AccountSubGroup } from '../models/AccountSubGroup';
import { AccountLedger } from '../models/AccountLedger';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { Transaction } from '../models/Transaction';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Indian Accounting - Groups
export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await AccountGroup.find({ isActive: true }).sort({ code: 1 });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const group = await AccountGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const subGroups = await AccountSubGroup.find({ groupId: group._id, isActive: true });
    
    res.json({ ...group.toObject(), subGroups });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const group = await AccountGroup.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Indian Accounting - Sub-Groups
export const getSubGroups = async (req: Request, res: Response) => {
  try {
    const { groupId, parentSubGroupId } = req.query;
    const filter: any = { isActive: true };
    if (groupId) filter.groupId = groupId;
    if (parentSubGroupId) filter.parentSubGroupId = parentSubGroupId;
    if (parentSubGroupId === 'null') filter.parentSubGroupId = null;
    
    const subGroups = await AccountSubGroup.find(filter)
      .populate('groupId')
      .populate('parentSubGroupId')
      .sort({ code: 1 });
    res.json(subGroups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubGroupById = async (req: Request, res: Response) => {
  try {
    const subGroup = await AccountSubGroup.findById(req.params.id)
      .populate('groupId')
      .populate('parentSubGroupId');
    if (!subGroup) return res.status(404).json({ message: 'Sub-group not found' });
    
    const childSubGroups = await AccountSubGroup.find({ parentSubGroupId: subGroup._id, isActive: true });
    const accounts = await Account.find({ subGroupId: subGroup._id, isActive: true });
    
    res.json({ ...subGroup.toObject(), childSubGroups, accounts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubGroup = async (req: Request, res: Response) => {
  try {
    const { parentSubGroupId, groupId } = req.body;
    let level = 1;
    
    if (parentSubGroupId) {
      const parent = await AccountSubGroup.findById(parentSubGroupId);
      if (!parent) return res.status(404).json({ message: 'Parent sub-group not found' });
      level = parent.level + 1;
    }
    
    const subGroup = await AccountSubGroup.create({ ...req.body, level, createdBy: req.user?._id });
    res.status(201).json(subGroup);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Indian Accounting - Ledgers
export const getLedgers = async (req: Request, res: Response) => {
  try {
    const { accountId, search } = req.query;
    const filter: any = { isActive: true };
    if (accountId) filter.accountId = accountId;
    if (search) filter.name = { $regex: search, $options: 'i' };
    
    const ledgers = await AccountLedger.find(filter)
      .populate({ path: 'accountId', populate: { path: 'subGroupId' } })
      .sort({ code: 1 });
    res.json(ledgers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLedgerById = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const ledger = await AccountLedger.findById(req.params.id)
      .populate({ path: 'accountId', populate: { path: 'subGroupId' } });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });
    
    const query: any = {
      'lines.ledgerId': ledger._id,
      isPosted: true
    };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    let transactionQuery = JournalEntry.find(query)
      .sort({ date: -1 })
      .select('entryNumber date description lines totalDebit totalCredit');
    
    if (limit) {
      transactionQuery = transactionQuery.limit(Number(limit));
    }
    
    const transactions = await transactionQuery;
    
    const ledgerTransactions = transactions.map(entry => {
      const line = entry.lines.find(l => l.ledgerId.toString() === ledger._id.toString());
      return {
        entryNumber: entry.entryNumber,
        date: entry.date,
        description: line?.description || entry.description,
        debit: line?.debit || 0,
        credit: line?.credit || 0
      };
    });
    
    res.json({ ...ledger.toObject(), transactions: ledgerTransactions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await AccountLedger.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json(ledger);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await AccountLedger.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });
    res.json(ledger);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await AccountLedger.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });
    res.json({ message: 'Ledger deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Hierarchy View
const buildSubGroupTree = async (parentId: any): Promise<any[]> => {
  const subGroups = await AccountSubGroup.find({ parentSubGroupId: parentId, isActive: true }).sort({ code: 1 });
  return Promise.all(subGroups.map(async (sg) => {
    const children = await buildSubGroupTree(sg._id);
    const accounts = await Account.find({ subGroupId: sg._id, isActive: true }).sort({ code: 1 });
    const accountsWithLedgers = await Promise.all(accounts.map(async (acc) => {
      const ledgers = await AccountLedger.find({ accountId: acc._id, isActive: true }).sort({ code: 1 });
      return { ...acc.toObject(), ledgers };
    }));
    return { ...sg.toObject(), children, accounts: accountsWithLedgers };
  }));
};

export const getAccountHierarchy = async (req: Request, res: Response) => {
  try {
    const groups = await AccountGroup.find({ isActive: true }).sort({ code: 1 });
    const hierarchy = await Promise.all(groups.map(async (group) => {
      const rootSubGroups = await AccountSubGroup.find({ groupId: group._id, parentSubGroupId: null, isActive: true }).sort({ code: 1 });
      const subGroupsWithChildren = await Promise.all(rootSubGroups.map(async (sg) => {
        const children = await buildSubGroupTree(sg._id);
        const accounts = await Account.find({ subGroupId: sg._id, isActive: true }).sort({ code: 1 });
        const accountsWithLedgers = await Promise.all(accounts.map(async (acc) => {
          const ledgers = await AccountLedger.find({ accountId: acc._id, isActive: true }).sort({ code: 1 });
          return { ...acc.toObject(), ledgers };
        }));
        return { ...sg.toObject(), children, accounts: accountsWithLedgers };
      }));
      return { ...group.toObject(), subGroups: subGroupsWithChildren };
    }));
    res.json(hierarchy);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy - Get all accounts with hierarchy
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

    // Don't allow updating code if it would create a duplicate
    if (updates.code) {
      const existing = await Account.findOne({ code: updates.code, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Account code already exists' });
      }
    }

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
    res.status(500).json({ 
      message: 'Error updating account',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const account = await Account.findByIdAndDelete(id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
};

// Get single journal entry
export const getJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await JournalEntry.findById(id)
      .populate('lines.ledgerId', 'code name')
      .populate('createdBy', 'name email');
    
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    logger.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'Error fetching journal entry' });
  }
};

// Get journal entries
export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    
    const query: any = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const journalEntries = await JournalEntry.find(query)
      .populate('lines.ledgerId', 'code name')
      .populate('createdBy', 'name email')
      .sort({ date: -1, entryNumber: -1 })
      .limit(Number(limit))
      .skip(skip);

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
    const userId = (req as any).user?.id;

    if (!date || !description || !lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: date, description, and at least one line item required' 
      });
    }

    // Validate and sanitize each line - use Account model directly
    const sanitizedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const accountId = line.accountId || line.ledgerId;
      if (!accountId) {
        return res.status(400).json({ 
          message: `Line ${i + 1}: Account is required`
        });
      }
      
      // Verify account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(400).json({ 
          message: `Line ${i + 1}: Invalid account ID`
        });
      }
      
      sanitizedLines.push({
        ledgerId: account._id,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description?.trim() || description
      });
    }

    const totalDebit = sanitizedLines.reduce((sum: number, line: any) => sum + line.debit, 0);
    const totalCredit = sanitizedLines.reduce((sum: number, line: any) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        message: `Journal entry is not balanced. Debits: ${totalDebit.toFixed(2)}, Credits: ${totalCredit.toFixed(2)}` 
      });
    }

    const lastEntry = await JournalEntry.findOne().sort({ entryNumber: -1 });
    const nextNumber = lastEntry 
      ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 
      : 1;
    const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

    const journalEntry = new JournalEntry({
      entryNumber,
      date: new Date(date),
      reference: reference || '',
      description,
      lines: sanitizedLines,
      createdBy: userId
    });

    await journalEntry.save();
    
    await journalEntry.populate([
      { path: 'lines.ledgerId', select: 'code name' },
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

// Update journal entry
export const updateJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, reference, description, lines } = req.body;
    
    const entry = await JournalEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    if (entry.isPosted) {
      return res.status(400).json({ message: 'Cannot edit posted journal entry' });
    }
    
    // Validate lines if provided
    if (lines && Array.isArray(lines)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.ledgerId || !line.description) {
          return res.status(400).json({ 
            message: `Line ${i + 1}: Ledger and description are required` 
          });
        }
      }
      
      const totalDebit = lines.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0);
      const totalCredit = lines.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ 
          message: `Journal entry is not balanced. Debits: ${totalDebit.toFixed(2)}, Credits: ${totalCredit.toFixed(2)}` 
        });
      }
    }
    
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (reference !== undefined) updateData.reference = reference;
    if (description) updateData.description = description;
    if (lines) updateData.lines = lines;
    
    const updated = await JournalEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lines.ledgerId', 'code name').populate('createdBy', 'name email');
    
    res.json(updated);
  } catch (error) {
    logger.error('Error updating journal entry:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error updating journal entry' 
    });
  }
};

// Delete journal entry
export const deleteJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await JournalEntry.findById(id);
    
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    if (entry.isPosted) {
      return res.status(400).json({ message: 'Cannot delete posted journal entry' });
    }
    
    await JournalEntry.findByIdAndDelete(id);
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting journal entry:', error);
    res.status(500).json({ message: 'Error deleting journal entry' });
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

    // Process each journal line - update Account balances
    for (const line of journalEntry.lines) {
      const account = await Account.findById(line.ledgerId).session(session);
      if (!account) continue;

      // Calculate new balance based on account type
      let newBalance = account.balance;
      if (['asset', 'expense'].includes(account.type)) {
        // Debit increases, credit decreases
        newBalance += line.debit - line.credit;
      } else {
        // Credit increases, debit decreases
        newBalance += line.credit - line.debit;
      }

      // Update account balance
      await Account.findByIdAndUpdate(
        line.ledgerId,
        { balance: newBalance },
        { session }
      );
      
      // Create ledger entry for audit trail
      if (Ledger) {
        await Ledger.create([{
          accountId: line.ledgerId,
          journalEntryId: journalEntry._id,
          date: journalEntry.date,
          description: line.description,
          reference: journalEntry.reference,
          debit: line.debit,
          credit: line.credit,
          balance: newBalance
        }], { session });
      }
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
    const { startDate, endDate, page = 1, limit } = req.query;
    
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

    let ledgerQuery = Ledger.find(query)
      .populate('journalEntryId', 'entryNumber reference')
      .sort({ date: 1, createdAt: 1 });
    
    if (limit) {
      ledgerQuery = ledgerQuery.limit(Number(limit) * Number(page)).skip((Number(page) - 1) * Number(limit));
    }
    
    const ledgerEntries = await ledgerQuery;

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
        const incomeGroup = await AccountGroup.findOne({ type: 'income', isActive: true });
        const expensesGroup = await AccountGroup.findOne({ type: 'expenses', isActive: true });
        
        if (!incomeGroup || !expensesGroup) {
          return res.status(404).json({ message: 'Account groups not found' });
        }
        
        const incomeSubGroups = await AccountSubGroup.find({ groupId: incomeGroup._id, isActive: true });
        const expenseSubGroups = await AccountSubGroup.find({ groupId: expensesGroup._id, isActive: true });
        
        const incomeAccounts = await Account.find({ type: 'revenue', isActive: true });
        const expenseAccounts = await Account.find({ type: 'expense', isActive: true });
        
        const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.balance, 0);
        const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
        
        res.json({
          reportType: 'Profit & Loss Statement',
          period: { startDate, endDate },
          revenue: {
            accounts: incomeAccounts.map(a => ({
              code: a.code,
              name: a.name,
              balance: a.balance
            })),
            total: totalIncome
          },
          expenses: {
            accounts: expenseAccounts.map(a => ({
              code: a.code,
              name: a.name,
              balance: a.balance
            })),
            total: totalExpenses
          },
          netIncome: totalIncome - totalExpenses
        });
        break;
        
      case 'balance-sheet':
        const assetsGroup = await AccountGroup.findOne({ type: 'assets', isActive: true });
        const liabilitiesGroup = await AccountGroup.findOne({ type: 'liabilities', isActive: true });
        
        if (!assetsGroup || !liabilitiesGroup) {
          return res.status(404).json({ message: 'Account groups not found' });
        }
        
        const assetSubGroups = await AccountSubGroup.find({ groupId: assetsGroup._id, isActive: true });
        const liabilitySubGroups = await AccountSubGroup.find({ groupId: liabilitiesGroup._id, isActive: true });
        
        const assetAccounts = await Account.find({ type: 'asset', isActive: true });
        const liabilityAccounts = await Account.find({ type: 'liability', isActive: true });
        
        const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
        
        res.json({
          reportType: 'Balance Sheet',
          asOfDate: endDate || new Date(),
          assets: {
            accounts: assetAccounts.map(a => ({
              code: a.code,
              name: a.name,
              balance: a.balance
            })),
            total: totalAssets
          },
          liabilities: {
            accounts: liabilityAccounts.map(a => ({
              code: a.code,
              name: a.name,
              balance: a.balance
            })),
            total: totalLiabilities
          },
          difference: totalAssets - totalLiabilities
        });
        break;
        
      case 'cash-flow':
        const cashAccounts = await Account.find({ 
          subType: 'cash',
          isActive: true 
        });
        
        const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
        
        res.json({
          reportType: 'Cash Flow Statement',
          period: { startDate, endDate },
          operating: { receipts: 0, payments: 0, net: 0 },
          investing: { receipts: 0, payments: 0, net: 0 },
          financing: { receipts: 0, payments: 0, net: 0 },
          netCashFlow: totalCash,
          openingBalance: 0,
          closingBalance: totalCash
        });
        break;
        
      default:
        res.status(400).json({ message: 'Invalid report type. Use: profit-loss, balance-sheet, cash-flow' });
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