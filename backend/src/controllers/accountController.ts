import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { generateEntryNumber } from '../utils/numberGenerator';

// Bulk create accounts
export const bulkCreateAccounts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { accounts } = req.body;
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ success: false, message: 'Accounts array is required' });
    }

    if (accounts.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 accounts allowed per bulk operation' });
    }

    const processedAccounts = [];
    const errors = [];

    for (let i = 0; i < accounts.length; i++) {
      const accountData = accounts[i];
      try {
        if (!accountData.name || !accountData.type) {
          errors.push(`Row ${i + 1}: Name and type are required`);
          continue;
        }

        if (!accountData.code) {
          accountData.code = await generateAccountCode(accountData.type);
        }

        processedAccounts.push({ ...accountData, createdBy: req.user.id });
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors });
    }

    const createdAccounts = await Account.insertMany(processedAccounts);
    res.status(201).json({ 
      success: true, 
      data: createdAccounts,
      message: `${createdAccounts.length} accounts created successfully`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Validate required fields
    if (!req.body.name || !req.body.type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account name and type are required' 
      });
    }

    // Auto-generate account code if not provided
    if (!req.body.code) {
      req.body.code = await generateAccountCode(req.body.type);
    }

    // Validate PAN format if provided
    if (req.body.taxInfo?.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(req.body.taxInfo.panNo)) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format' });
    }

    // Validate IFSC format if provided
    if (req.body.bankDetails?.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(req.body.bankDetails.ifscCode)) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC code format' });
    }
    
    const account = new Account({ ...req.body, createdBy: req.user.id });
    await account.save();
    res.status(201).json({ success: true, data: account, message: 'Account created successfully' });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Account code already exists' });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

// Generate unique account code based on type
const generateAccountCode = async (type: string): Promise<string> => {
  const prefixMap: { [key: string]: string } = {
    'asset': 'AST',
    'liability': 'LIB', 
    'equity': 'EQT',
    'revenue': 'REV',
    'expense': 'EXP'
  };
  
  const prefix = prefixMap[type] || 'ACC';
  
  // Get next sequence number for this type
  const lastAccount = await Account.findOne(
    { code: { $regex: `^${prefix}` } },
    {},
    { sort: { code: -1 } }
  );
  
  let sequence = 1;
  if (lastAccount) {
    const lastSequence = parseInt(lastAccount.code.replace(prefix, ''));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
};

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { projectId, type, search, page = 1, limit = 50, includeInactive = false } = req.query;
    const filter: any = includeInactive === 'true' ? {} : { isActive: true };
    
    if (projectId) filter.projectId = projectId;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'taxInfo.gstNo': { $regex: search, $options: 'i' } },
        { 'taxInfo.panNo': { $regex: search, $options: 'i' } },
        { 'contactInfo.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const accounts = await Account.find(filter)
      .populate('parentId', 'name code')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Account.countDocuments(filter);
    
    // Get summary stats
    const stats = await Account.aggregate([
      { $match: filter },
      { $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalBalance: { $sum: '$balance' }
      }}
    ]);
    
    res.json({ 
      success: true, 
      data: accounts,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('parentId', 'name code')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email');
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const existingAccount = await Account.findById(req.params.id);
    if (!existingAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Validate PAN format if provided
    if (req.body.taxInfo?.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(req.body.taxInfo.panNo)) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format' });
    }

    // Validate IFSC format if provided
    if (req.body.bankDetails?.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(req.body.bankDetails.ifscCode)) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC code format' });
    }

    // Prevent code changes if different
    if (req.body.code && existingAccount.code !== req.body.code) {
      console.warn(`Account code change attempted: ${existingAccount.code} to ${req.body.code}`);
      delete req.body.code; // Remove code from update
    }
    
    const account = await Account.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, data: account, message: 'Account updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Duplicate account entry (editable copy)
export const duplicateAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const originalAccount = await Account.findById(req.params.id);
    if (!originalAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Create duplicate with new code and name suffix
    const duplicateData = originalAccount.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.__v;
    
    duplicateData.code = await generateAccountCode(duplicateData.type);
    duplicateData.name = `${duplicateData.name} (Copy)`;
    duplicateData.balance = 0; // Reset balance for new account
    duplicateData.openingBalance = 0;
    duplicateData.createdBy = req.user.id;
    
    // Clear unique identifiers
    if (duplicateData.taxInfo) {
      duplicateData.taxInfo.gstNo = '';
      duplicateData.taxInfo.panNo = '';
    }
    if (duplicateData.bankDetails) {
      duplicateData.bankDetails.accountNumber = '';
    }
    
    const duplicateAccount = new Account(duplicateData);
    await duplicateAccount.save();
    
    res.status(201).json({ 
      success: true, 
      data: duplicateAccount,
      message: 'Account duplicated successfully. Please update unique identifiers.' 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get account types for dropdown
export const getAccountTypes = async (req: Request, res: Response) => {
  try {
    const types = [
      { value: 'asset', label: 'Asset', description: 'Resources owned by the business', nature: 'debit' },
      { value: 'liability', label: 'Liability', description: 'Debts and obligations', nature: 'credit' },
      { value: 'equity', label: 'Equity', description: 'Owner\'s equity and capital', nature: 'credit' },
      { value: 'revenue', label: 'Revenue', description: 'Income and sales', nature: 'credit' },
      { value: 'expense', label: 'Expense', description: 'Costs and expenses', nature: 'debit' }
    ];
    
    // Get count for each type
    const counts = await Account.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const typesWithCounts = types.map(type => {
      const count = counts.find(c => c._id === type.value)?.count || 0;
      return { ...type, count };
    });
    
    res.json({ success: true, data: typesWithCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};