import { Request, Response } from 'express';
import ChartOfAccount from '../models/ChartOfAccount';
import { AccountGroup } from '../models/AccountGroup';
import { AccountSubGroup } from '../models/AccountSubGroup';
import { PartyLedger } from '../models/PartyLedger';
import JournalEntry from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { Transaction } from '../models/Transaction';
import { CostCenter } from '../models/CostCenter';
import { Currency, ExchangeRate } from '../models/Currency';
import { BillDetail } from '../models/BillDetail';
import { GLBudget } from '../models/GLBudget';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Groups
export const getGroups = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const getGroupById = async (req: Request, res: Response) => {
  res.json({ success: true, data: null });
};

export const createGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteGroup = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Group deleted' });
};

// Sub-Groups
export const getSubGroups = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const getSubGroupById = async (req: Request, res: Response) => {
  res.json({ success: true, data: null });
};

export const createSubGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateSubGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteSubGroup = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Sub-group deleted' });
};

// Ledgers
export const getLedgers = async (req: Request, res: Response) => {
  try {
    const { accountId, search } = req.query;
    const filter: any = { isActive: true };
    if (accountId) filter.accountId = accountId;
    if (search) filter.name = { $regex: search, $options: 'i' };
    
    const ledgers = await PartyLedger.find(filter)
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
    const ledger = await PartyLedger.findById(req.params.id)
      .populate({ path: 'accountId', populate: { path: 'subGroupId' } });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });
    
    const query: any = {
      'lines.accountId': ledger.accountId,
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
      const line = entry.lines.find(l => l.accountId?.toString() === ledger.accountId?.toString());
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
    const ledger = await PartyLedger.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json(ledger);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await PartyLedger.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });
    res.json(ledger);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await PartyLedger.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
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
    const accounts = await ChartOfAccount.find({ subGroupId: sg._id, isActive: true }).sort({ code: 1 });
    return { ...sg.toObject(), children, accounts };
  }));
};

export const getAccountHierarchy = async (req: Request, res: Response) => {
  try {
    const groups = await AccountGroup.find({ isActive: true }).sort({ code: 1 });
    const hierarchy = await Promise.all(groups.map(async (group) => {
      const rootSubGroups = await AccountSubGroup.find({ groupId: group._id, parentSubGroupId: null, isActive: true }).sort({ code: 1 });
      const subGroupsWithChildren = await Promise.all(rootSubGroups.map(async (sg) => {
        const children = await buildSubGroupTree(sg._id);
        const accounts = await ChartOfAccount.find({ subGroupId: sg._id, isActive: true }).sort({ code: 1 });
        return { ...sg.toObject(), children, accounts };
      }));
      return { ...group.toObject(), subGroups: subGroupsWithChildren };
    }));
    res.json(hierarchy);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all accounts with hierarchy
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { type, isGroup, includeInactive, hierarchy } = req.query;
    
    const query: any = {};
    if (type) query.type = type;
    if (isGroup !== undefined) query.isGroup = isGroup === 'true';
    if (includeInactive !== 'true') query.isActive = true;
    
    const accounts = await ChartOfAccount.find(query)
      .populate('parentId', 'name code type')
      .populate('contactId', 'name email')
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
    const existingAccount = await ChartOfAccount.findOne({ code: accountData.code });
    if (existingAccount) {
      return res.status(400).json({ message: 'Account code already exists' });
    }

    // Calculate level based on parent
    let level = 0;
    let parentType = accountData.type;
    if (accountData.parentId) {
      const parent = await ChartOfAccount.findById(accountData.parentId);
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
    const account = new ChartOfAccount(accountDoc);
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
    console.log('=== UPDATE ACCOUNT REQUEST ===');
    console.log('Account ID:', req.params.id);
    console.log('Updates:', JSON.stringify(req.body, null, 2));
    
    const { id } = req.params;
    const updates = req.body;

    // Check if account exists
    const existingAccount = await ChartOfAccount.findById(id);
    if (!existingAccount) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Don't allow updating code if it would create a duplicate
    if (updates.code && updates.code !== existingAccount.code) {
      const duplicate = await ChartOfAccount.findOne({ code: updates.code, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ message: 'Account code already exists' });
      }
    }

    // Clean up parentId if it's 'none' or empty
    if (updates.parentId === 'none' || updates.parentId === '') {
      updates.parentId = null;
    }

    console.log('Cleaned updates:', JSON.stringify(updates, null, 2));

    const account = await ChartOfAccount.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('parentId', 'name code');

    console.log('Updated account:', account?._id);
    res.json(account);
  } catch (error) {
    console.error('=== ERROR UPDATING ACCOUNT ===');
    console.error('Error:', error);
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
    const account = await ChartOfAccount.findByIdAndDelete(id);
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
      .populate('lines.account', 'code name type')
      .populate('createdBy', 'firstName lastName name email')
      .populate('updatedBy', 'firstName lastName name email')
      .populate('postedBy', 'firstName lastName name email')
      .populate('changeHistory.changedBy', 'firstName lastName name email')
      .lean();
    
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
    
    const matchStage: any = {};
    if (startDate && endDate) {
      matchStage.entryDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // Use aggregation pipeline for efficient single-query population
    const journalEntries = await JournalEntry.aggregate([
      { $match: matchStage },
      { $sort: { entryDate: -1, entryNumber: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'accounts',
          localField: 'lines.account',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByUser'
        }
      },
      {
        $addFields: {
          lines: {
            $map: {
              input: '$lines',
              as: 'line',
              in: {
                $mergeObjects: [
                  '$$line',
                  {
                    account: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$accountDetails',
                            as: 'acc',
                            cond: { $eq: ['$$acc._id', '$$line.account'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          },
          createdBy: { $arrayElemAt: ['$createdByUser', 0] }
        }
      },
      {
        $project: {
          accountDetails: 0,
          createdByUser: 0,
          'createdBy.password': 0,
          'lines.account.balance': 0,
          'lines.account.openingBalance': 0
        }
      }
    ]);

    const total = await JournalEntry.countDocuments(matchStage);

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
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Error fetching journal entries',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
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
      
      const accountId = line.account || line.accountId;
      if (!accountId) {
        return res.status(400).json({ 
          message: `Line ${i + 1}: Account is required`
        });
      }
      
      // Verify account exists
      const account = await ChartOfAccount.findById(accountId);
      if (!account) {
        return res.status(400).json({ 
          message: `Line ${i + 1}: Invalid account ID`
        });
      }
      
      sanitizedLines.push({
        account: account._id,
        accountId: account._id,
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

    const entryDate = new Date(date);
    let journalEntry;
    let retries = 5;
    
    while (retries > 0) {
      try {
        // Get all entry numbers to find the actual next available number
        const existingNumbers = await JournalEntry.find({}, { entryNumber: 1 })
          .sort({ entryNumber: -1 })
          .limit(100)
          .lean();
        
        const usedNumbers = new Set(
          existingNumbers.map(e => parseInt(e.entryNumber.replace('JE', '')))
        );
        
        let nextNumber = 1;
        if (existingNumbers.length > 0) {
          const lastNumber = parseInt(existingNumbers[0].entryNumber.replace('JE', ''));
          nextNumber = lastNumber + 1;
          
          // Find first available number if there are gaps
          while (usedNumbers.has(nextNumber)) {
            nextNumber++;
          }
        }
        
        const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

        journalEntry = new JournalEntry({
          entryNumber,
          date: entryDate,
          entryDate: entryDate,
          reference: reference || '',
          description,
          lines: sanitizedLines,
          totalDebit,
          totalCredit,
          periodYear: entryDate.getFullYear(),
          periodMonth: entryDate.getMonth() + 1,
          createdBy: userId
        });

        await journalEntry.save();
        break;
      } catch (error: any) {
        if (error.code === 11000 && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          continue;
        }
        throw error;
      }
    }
    
    if (!journalEntry) {
      throw new Error('Failed to create journal entry after retries');
    }
    
    await journalEntry.populate([
      { path: 'lines.account', select: 'code name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    // Auto-post the journal entry and update account balances
    try {
      console.log('=== AUTO-POSTING JOURNAL ENTRY ===');
      console.log('Entry ID:', journalEntry._id);
      console.log('Entry Number:', journalEntry.entryNumber);
      console.log('Lines count:', sanitizedLines.length);
      
      for (const line of sanitizedLines) {
        const account = await ChartOfAccount.findById(line.account);
        if (account) {
          const oldBalance = account.balance;
          let newBalance = account.balance;
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            newBalance += line.debit - line.credit;
          } else {
            newBalance += line.credit - line.debit;
          }
          console.log(`Account ${account.code}: ${oldBalance} -> ${newBalance} (Dr:${line.debit} Cr:${line.credit})`);
          await ChartOfAccount.findByIdAndUpdate(line.account, { balance: newBalance });
        } else {
          console.log('Account not found:', line.account);
        }
      }
      
      journalEntry.isPosted = true;
      journalEntry.status = 'POSTED';
      await journalEntry.save();
      console.log('Entry saved with isPosted:', journalEntry.isPosted, 'status:', journalEntry.status);
      
      // Verify it was saved
      const verifyEntry = await JournalEntry.findById(journalEntry._id).lean();
      console.log('Verification - isPosted:', verifyEntry?.isPosted, 'status:', verifyEntry?.status);
      console.log('=== AUTO-POST COMPLETE ===');
    } catch (autoPostError) {
      console.error('=== AUTO-POST FAILED ===');
      console.error(autoPostError);
      logger.error('Auto-post failed:', autoPostError);
    }

    await journalEntry.populate([
      { path: 'lines.account', select: 'code name' },
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
    const userId = (req as any).user?.id;
    
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
        if (!line.account && !line.accountId) {
          return res.status(400).json({ 
            message: `Line ${i + 1}: Account is required` 
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
    
    // Track changes for audit trail
    const changes: any[] = [];
    if (date && entry.date?.toString() !== new Date(date).toString()) {
      changes.push({ field: 'date', oldValue: entry.date, newValue: new Date(date), changedBy: userId, changedAt: new Date() });
    }
    if (reference !== undefined && entry.reference !== reference) {
      changes.push({ field: 'reference', oldValue: entry.reference, newValue: reference, changedBy: userId, changedAt: new Date() });
    }
    if (description && entry.description !== description) {
      changes.push({ field: 'description', oldValue: entry.description, newValue: description, changedBy: userId, changedAt: new Date() });
    }
    if (lines && JSON.stringify(entry.lines) !== JSON.stringify(lines)) {
      changes.push({ field: 'lines', oldValue: `${entry.lines.length} lines`, newValue: `${lines.length} lines`, changedBy: userId, changedAt: new Date() });
    }
    
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (reference !== undefined) updateData.reference = reference;
    if (description) updateData.description = description;
    if (lines) updateData.lines = lines;
    if (userId) updateData.updatedBy = userId;
    if (changes.length > 0) {
      updateData.$push = { changeHistory: { $each: changes } };
    }
    
    const updated = await JournalEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lines.account', 'code name').populate('createdBy', 'name email');
    
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
    const userId = (req as any).user?.id;
    const entry = await JournalEntry.findById(id);
    
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    if (entry.isPosted) {
      return res.status(400).json({ message: 'Cannot delete posted journal entry' });
    }
    
    // Add audit trail before deletion
    entry.changeHistory.push({
      field: 'status',
      oldValue: entry.status,
      newValue: 'deleted',
      changedBy: userId,
      changedAt: new Date()
    });
    await entry.save();
    
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
    const userId = (req as any).user?.id;

    const journalEntry = await JournalEntry.findById(id).session(session);
    if (!journalEntry) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (journalEntry.isPosted) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Journal entry already posted' });
    }

    // Add audit trail for posting
    journalEntry.changeHistory.push({
      field: 'status',
      oldValue: 'draft',
      newValue: 'posted',
      changedBy: userId,
      changedAt: new Date()
    });

    // Process each journal line - update Account balances
    for (const line of journalEntry.lines) {
      const accountId = (line as any).account;
      if (!accountId) {
        console.error('Line missing account:', line);
        continue;
      }
      const account = await ChartOfAccount.findById(accountId).session(session);
      if (!account) {
        console.error('Account not found:', accountId);
        continue;
      }

      // Calculate new balance based on account type
      let newBalance = account.balance;
      if (['ASSET', 'EXPENSE'].includes(account.type)) {
        // Debit increases, credit decreases
        newBalance += line.debit - line.credit;
      } else {
        // Credit increases, debit decreases
        newBalance += line.credit - line.debit;
      }

      // Update account balance
      await ChartOfAccount.findByIdAndUpdate(
        accountId,
        { balance: newBalance },
        { session }
      );
      
      // Create ledger entry for audit trail
      if (Ledger) {
        await Ledger.create([{
          accountId: accountId,
          journalEntryId: journalEntry._id,
          date: journalEntry.date || journalEntry.entryDate,
          description: line.description || journalEntry.description,
          reference: journalEntry.reference || journalEntry.entryNumber,
          debit: line.debit,
          credit: line.credit,
          balance: newBalance
        }], { session });
      }
    }

    // Mark journal entry as posted
    journalEntry.isPosted = true;
    journalEntry.postedBy = userId;
    journalEntry.postingDate = new Date();
    await journalEntry.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Journal entry posted successfully' });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error posting journal entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error posting journal entry';
    console.error('Post journal entry error details:', error);
    res.status(500).json({ message: errorMessage, error: error instanceof Error ? error.stack : String(error) });
  } finally {
    session.endSession();
  }
};

// Get trial balance
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const dateFilter = asOfDate ? new Date(asOfDate as string) : new Date();
    
    const accounts = await ChartOfAccount.find({ isActive: true }).sort({ code: 1 });
    
    const trialBalance = accounts.map(account => {
      // For normal balance calculation based on account type
      let debit = 0, credit = 0;
      
      if (['ASSET', 'EXPENSE'].includes(account.type)) {
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
    
    console.log('=== GET ACCOUNT LEDGER ===');
    console.log('Account ID:', accountId);
    console.log('Date range:', startDate, 'to', endDate);
    
    const account = await ChartOfAccount.findById(accountId);
    if (!account) {
      console.log('Account not found');
      return res.status(404).json({ message: 'Account not found' });
    }
    console.log('Account found:', account.code, account.name);

    // Get journal entries that include this account
    const journalQuery: any = {
      'lines.account': accountId,
      isPosted: true
    };
    if (startDate && endDate) {
      journalQuery.entryDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    console.log('Query:', JSON.stringify(journalQuery));

    const journalEntries = await JournalEntry.find(journalQuery)
      .sort({ entryDate: 1, createdAt: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
      
    console.log('Found', journalEntries.length, 'journal entries');
    journalEntries.forEach(e => {
      console.log('Entry:', e.entryNumber, 'Posted:', e.isPosted, 'Date:', e.entryDate);
    });

    // Transform to ledger format with auto-calculated running balance
    let runningBalance = 0;
    const entries = journalEntries.flatMap(entry => {
      return entry.lines
        .filter((line: any) => line.account.toString() === accountId)
        .map((line: any) => {
          // Auto-calculate running balance based on account type
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            runningBalance += line.debit - line.credit;
          } else {
            runningBalance += line.credit - line.debit;
          }
          return {
            _id: entry._id,
            date: entry.entryDate || entry.date,
            description: line.description || entry.description,
            reference: entry.reference || entry.entryNumber,
            journalEntryId: {
              entryNumber: entry.entryNumber,
              reference: entry.reference
            },
            debit: line.debit,
            credit: line.credit,
            balance: runningBalance
          };
        });
    });
    
    console.log('Transformed to', entries.length, 'ledger entries');

    const total = await JournalEntry.countDocuments(journalQuery);
    console.log('Total matching entries:', total);

    res.json({
      account: {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
        currentBalance: account.balance
      },
      entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('=== ERROR IN GET ACCOUNT LEDGER ===');
    console.error(error);
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
        
        const incomeAccounts = await ChartOfAccount.find({ type: 'REVENUE', isActive: true });
        const expenseAccounts = await ChartOfAccount.find({ type: 'EXPENSE', isActive: true });
        
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
        
        const assetAccounts = await ChartOfAccount.find({ type: 'ASSET', isActive: true });
        const liabilityAccounts = await ChartOfAccount.find({ type: 'LIABILITY', isActive: true });
        
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
        const cashAccounts = await ChartOfAccount.find({ 
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

// Voucher Types
export const getVouchersByType = async (req: Request, res: Response) => {
  try {
    const { voucherType } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const query: any = { voucherType };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const entries = await JournalEntry.find(query)
      .populate('lines.account', 'code name')
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await JournalEntry.countDocuments(query);
    
    res.json({ entries, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Currencies
export const getCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find().sort({ code: 1 });
    res.json(currencies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCurrency = async (req: Request, res: Response) => {
  try {
    const currency = await Currency.create(req.body);
    res.status(201).json(currency);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCurrency = async (req: Request, res: Response) => {
  try {
    const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!currency) return res.status(404).json({ message: 'Currency not found' });
    res.json(currency);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCurrency = async (req: Request, res: Response) => {
  try {
    const currency = await Currency.findByIdAndDelete(req.params.id);
    if (!currency) return res.status(404).json({ message: 'Currency not found' });
    res.json({ message: 'Currency deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getExchangeRate = async (req: Request, res: Response) => {
  try {
    const { fromCurrency, toCurrency, date } = req.query;
    const query: any = { fromCurrency, toCurrency };
    if (date) query.date = { $lte: new Date(date as string) };
    
    const rate = await ExchangeRate.findOne(query).sort({ date: -1 });
    res.json(rate || { rate: 1 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateExchangeRate = async (req: Request, res: Response) => {
  try {
    const rate = await ExchangeRate.create(req.body);
    res.status(201).json(rate);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Cost Centers
export const getCostCenters = async (req: Request, res: Response) => {
  try {
    const costCenters = await CostCenter.find({ isActive: true })
      .populate('departmentId', 'name')
      .populate('projectId', 'name')
      .sort({ code: 1 });
    res.json(costCenters);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCostCenter = async (req: Request, res: Response) => {
  try {
    const costCenter = await CostCenter.create(req.body);
    res.status(201).json(costCenter);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCostCenter = async (req: Request, res: Response) => {
  try {
    const costCenter = await CostCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!costCenter) return res.status(404).json({ message: 'Cost center not found' });
    res.json(costCenter);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCostCenter = async (req: Request, res: Response) => {
  try {
    const costCenter = await CostCenter.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!costCenter) return res.status(404).json({ message: 'Cost center not found' });
    res.json({ message: 'Cost center deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCostCenterReport = async (req: Request, res: Response) => {
  try {
    const { costCenterId } = req.params;
    const { startDate, endDate } = req.query;
    
    const costCenter = await CostCenter.findById(costCenterId);
    if (!costCenter) return res.status(404).json({ message: 'Cost center not found' });
    
    const query: any = {
      'lines.costCenter': costCenter.code,
      isPosted: true
    };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    const entries = await JournalEntry.find(query)
      .populate('lines.account', 'code name')
      .sort({ date: -1 });
    
    let totalDebit = 0, totalCredit = 0;
    const transactions = entries.flatMap(entry => 
      entry.lines
        .filter(line => line.costCenter === costCenter.code)
        .map(line => {
          totalDebit += line.debit;
          totalCredit += line.credit;
          return {
            date: entry.date,
            entryNumber: entry.entryNumber,
            description: line.description,
            debit: line.debit,
            credit: line.credit
          };
        })
    );
    
    res.json({ costCenter, transactions, totalDebit, totalCredit, net: totalDebit - totalCredit });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Bill-wise Details
export const getBillDetails = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { status } = req.query;
    const query: any = { accountId };
    if (status) query.status = status;
    
    const bills = await BillDetail.find(query).sort({ billDate: -1 });
    res.json(bills);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBillDetail = async (req: Request, res: Response) => {
  try {
    const billData = { ...req.body, balanceAmount: req.body.billAmount - (req.body.paidAmount || 0) };
    const bill = await BillDetail.create(billData);
    res.status(201).json(bill);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBillDetail = async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    const bill = await BillDetail.findByIdAndUpdate(billId, req.body, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBillDetail = async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    const bill = await BillDetail.findByIdAndDelete(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBillPayment = async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    const { paymentAmount } = req.body;
    
    const bill = await BillDetail.findById(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    
    bill.paidAmount += paymentAmount;
    bill.balanceAmount = bill.billAmount - bill.paidAmount;
    bill.status = bill.balanceAmount === 0 ? 'paid' : bill.paidAmount > 0 ? 'partial' : 'pending';
    await bill.save();
    
    res.json(bill);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBillStatement = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query: any = { accountId };
    if (startDate && endDate) {
      query.billDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    const bills = await BillDetail.find(query).sort({ billDate: -1 });
    const summary = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, b) => sum + b.billAmount, 0),
      totalPaid: bills.reduce((sum, b) => sum + b.paidAmount, 0),
      totalBalance: bills.reduce((sum, b) => sum + b.balanceAmount, 0)
    };
    
    res.json({ bills, summary });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const calculateInterest = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { fromDate, toDate } = req.body;
    
    const account = await ChartOfAccount.findById(accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (!account.enableInterest) return res.status(400).json({ message: 'Interest not enabled for this account' });
    
    const days = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));
    const interest = (account.balance * (account.interestRate || 0) * days) / (365 * 100);
    
    res.json({ accountId, fromDate, toDate, principal: account.balance, rate: account.interestRate, days, interest });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const postInterestEntry = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { interest, date, interestAccountId } = req.body;
    
    const lastEntry = await JournalEntry.findOne().sort({ entryNumber: -1 });
    const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 : 1;
    const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;
    
    const entry = await JournalEntry.create({
      entryNumber,
      voucherType: 'journal',
      date: new Date(date),
      description: 'Interest calculation',
      lines: [
        { accountId: interestAccountId, debit: interest, credit: 0, description: 'Interest expense' },
        { accountId, debit: 0, credit: interest, description: 'Interest income' }
      ]
    });
    
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getInterestReport = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { fiscalYear } = req.query;
    
    const account = await ChartOfAccount.findById(accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    
    const startDate = new Date(`${fiscalYear}-04-01`);
    const endDate = new Date(`${Number(fiscalYear) + 1}-03-31`);
    
    const entries = await JournalEntry.find({
      'lines.accountId': accountId,
      description: /interest/i,
      date: { $gte: startDate, $lte: endDate },
      isPosted: true
    });
    
    const totalInterest = entries.reduce((sum, e) => {
      const line = e.lines.find(l => l.accountId.toString() === accountId);
      return sum + (line ? line.credit - line.debit : 0);
    }, 0);
    
    res.json({ account, fiscalYear, totalInterest, entries });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGLBudgets = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const query: any = {};
    if (fiscalYear) query.fiscalYear = fiscalYear;
    
    const budgets = await GLBudget.find(query).populate('accountId', 'code name type');
    res.json(budgets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createGLBudget = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.create(req.body);
    res.status(201).json(budget);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGLBudget = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGLBudget = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudgetVarianceReport = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const budgets = await GLBudget.find({ fiscalYear }).populate('accountId', 'code name type');
    
    for (const budget of budgets) {
      const account = await ChartOfAccount.findById(budget.accountId);
      if (account) {
        budget.actualAmount = account.balance;
        budget.variance = budget.budgetAmount - budget.actualAmount;
        budget.utilizationPercent = budget.budgetAmount > 0 ? (budget.actualAmount / budget.budgetAmount) * 100 : 0;
        await budget.save();
      }
    }
    
    res.json(budgets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAccountBudgetStatus = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { fiscalYear } = req.query;
    
    const budget = await GLBudget.findOne({ accountId, fiscalYear });
    const account = await ChartOfAccount.findById(accountId);
    
    if (!account) return res.status(404).json({ message: 'Account not found' });
    
    const status = {
      account: { code: account.code, name: account.name, balance: account.balance },
      budget: budget ? budget.budgetAmount : 0,
      actual: account.balance,
      variance: budget ? budget.budgetAmount - account.balance : 0,
      utilization: budget && budget.budgetAmount > 0 ? (account.balance / budget.budgetAmount) * 100 : 0
    };
    
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const recalculateBalances = async (req: Request, res: Response) => {
  try {
    const accounts = await ChartOfAccount.find();
    for (const account of accounts) {
      account.balance = account.openingBalance || 0;
      await account.save();
    }
    
    const journalEntries = await JournalEntry.find().sort({ entryDate: 1, date: 1 });
    
    let updatedCount = 0;
    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        const accountId = (line as any).account;
        if (!accountId) continue;
        
        const account = await ChartOfAccount.findById(accountId);
        if (!account) continue;
        
        let newBalance = account.balance;
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          newBalance += line.debit - line.credit;
        } else {
          newBalance += line.credit - line.debit;
        }
        
        await ChartOfAccount.findByIdAndUpdate(accountId, { balance: newBalance });
        account.balance = newBalance;
        updatedCount++;
      }
      
      if (!entry.isPosted) {
        entry.isPosted = true;
        await entry.save();
      }
    }
    
    res.json({ 
      message: 'Account balances recalculated successfully',
      accountsReset: accounts.length,
      entriesProcessed: journalEntries.length,
      balancesUpdated: updatedCount
    });
  } catch (error) {
    logger.error('Error recalculating balances:', error);
    res.status(500).json({ 
      message: 'Error recalculating balances',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};


export const exportInvoice = async (req: Request, res: Response) => {
  try {
    const { entryIds, format, accountId } = req.body;
    
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({ message: 'Entry IDs are required' });
    }

    const account = await ChartOfAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Get journal entries for selected IDs
    const entries = await JournalEntry.find({
      _id: { $in: entryIds }
    }).sort({ entryDate: 1 });

    // Generate simple text invoice
    let content = `INVOICE\n\n`;
    content += `Account: ${account.code} - ${account.name}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;
    
    let totalDebit = 0, totalCredit = 0;
    
    for (const entry of entries) {
      const line = entry.lines.find((l: any) => l.account?.toString() === accountId);
      if (line) {
        content += `Date: ${entry.entryDate?.toLocaleDateString() || entry.date?.toLocaleDateString()}\n`;
        content += `Entry: ${entry.entryNumber}\n`;
        content += `Description: ${line.description || entry.description}\n`;
        content += `Debit: ${line.debit.toFixed(2)} | Credit: ${line.credit.toFixed(2)}\n`;
        content += `${'-'.repeat(80)}\n`;
        totalDebit += line.debit;
        totalCredit += line.credit;
      }
    }
    
    content += `\nTotal Debit: ${totalDebit.toFixed(2)}\n`;
    content += `Total Credit: ${totalCredit.toFixed(2)}\n`;
    content += `Net: ${(totalDebit - totalCredit).toFixed(2)}\n`;

    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${Date.now()}.${format}`);
    res.send(Buffer.from(content));
  } catch (error) {
    logger.error('Error exporting invoice:', error);
    res.status(500).json({ message: 'Error exporting invoice' });
  }
};


