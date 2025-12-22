import { Request, Response } from 'express';
import ChartOfAccount from '../models/ChartOfAccount';
import { AccountType } from '../models/AccountType';
import { generateEntryNumber } from '../utils/numberGenerator';
import { createContactFromAccount } from '../utils/accountContact';

const logger = { warn: (msg: string, data?: any) => console.warn(msg, data) };

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

    const createdAccounts = await ChartOfAccount.insertMany(processedAccounts);
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
    
    console.log('=== CREATE ACCOUNT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.name || !req.body.type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account name and type are required' 
      });
    }

    // Normalize type to uppercase
    req.body.type = req.body.type.toUpperCase();

    // Auto-generate account code if not provided
    if (!req.body.code) {
      req.body.code = await generateAccountCode(req.body.type);
    }

    // Set balance from openingBalance if provided
    if (req.body.openingBalance && !req.body.balance) {
      req.body.balance = req.body.openingBalance;
    }

    // Validate PAN format if provided
    if (req.body.taxInfo?.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(req.body.taxInfo.panNo)) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format' });
    }

    // Validate IFSC format if provided
    if (req.body.bankDetails?.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(req.body.bankDetails.ifscCode)) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC code format' });
    }
    
    console.log('Creating account with data:', JSON.stringify(req.body, null, 2));
    const account = new ChartOfAccount({ ...req.body, createdBy: req.user.id });
    console.log('Account instance created, validating...');
    await account.save();
    console.log('Account saved successfully:', account._id);
    
    // Auto-create contact if requested and account is customer/vendor type
    if (req.body.createContact) {
      try {
        await createContactFromAccount(account._id.toString(), req.body, req.user.id);
      } catch (contactError) {
        logger.warn('Failed to auto-create contact', { 
          error: contactError instanceof Error ? contactError.message : 'Unknown',
          accountId: account._id 
        });
      }
    }
    
    res.status(201).json({ success: true, data: account, message: 'Account created successfully' });
  } catch (error: any) {
    console.error('=== CREATE ACCOUNT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Account code already exists' });
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((e: any) => e.message).join(', ');
      console.error('Validation errors:', validationErrors);
      res.status(400).json({ success: false, message: `Validation failed: ${validationErrors}` });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

// Generate unique account code based on type
const generateAccountCode = async (type: string): Promise<string> => {
  const prefixMap: { [key: string]: string } = {
    'ASSET': 'AST',
    'asset': 'AST',
    'LIABILITY': 'LIB',
    'liability': 'LIB', 
    'EQUITY': 'EQT',
    'equity': 'EQT',
    'REVENUE': 'REV',
    'revenue': 'REV',
    'EXPENSE': 'EXP',
    'expense': 'EXP'
  };
  
  const prefix = prefixMap[type] || 'ACC';
  
  // Get next sequence number for this type
  const lastAccount = await ChartOfAccount.findOne(
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
    console.log('getAccounts called with query:', req.query);
    
    const { projectId, type, search, page = 1, limit = 50, includeInactive = false } = req.query;
    const filter: any = includeInactive === 'true' ? {} : { isActive: true };
    
    if (projectId) filter.projectId = projectId;
    if (type) {
      // Normalize type to uppercase for comparison
      const normalizedType = (type as string).toUpperCase();
      filter.type = normalizedType;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'taxInfo.gstNo': { $regex: search, $options: 'i' } },
        { 'taxInfo.panNo': { $regex: search, $options: 'i' } },
        { 'contactInfo.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Filter applied:', filter);
    
    // Check total count first
    const totalCount = await ChartOfAccount.countDocuments({});
    const activeCount = await ChartOfAccount.countDocuments({ isActive: true });
    console.log(`Total accounts: ${totalCount}, Active accounts: ${activeCount}`);
    
    const skip = (Number(page) - 1) * Number(limit);
    const accounts = await ChartOfAccount.find(filter)
      .populate('parentId', 'name code')
      .populate('groupId', 'name code')
      .populate('subGroupId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
      
    console.log(`Found ${accounts.length} accounts`);
    
    const total = await ChartOfAccount.countDocuments(filter);
    
    // Get summary stats
    const stats = await ChartOfAccount.aggregate([
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
    console.error('getAccounts error:', error.message, error.stack);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch accounts' });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await ChartOfAccount.findById(req.params.id)
      .populate('parentId', 'name code')
      .populate('groupId', 'name code')
      .populate('subGroupId', 'name code')
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
    const existingAccount = await ChartOfAccount.findById(req.params.id);
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

    const account = await ChartOfAccount.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: account, message: 'Account updated successfully' });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Account code already exists' });
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((e: any) => e.message).join(', ');
      res.status(400).json({ success: false, message: `Validation failed: ${validationErrors}` });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const account = await ChartOfAccount.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({ success: true, data: account, message: 'Account deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const duplicateAccount = async (req: Request, res: Response) => {
  try {
    const originalAccount = await ChartOfAccount.findById(req.params.id);
    if (!originalAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const duplicateData = originalAccount.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    duplicateData.code = await generateAccountCode(duplicateData.type);
    duplicateData.name = `${duplicateData.name} (Copy)`;
    duplicateData.balance = 0;
    duplicateData.openingBalance = 0;

    const newAccount = new ChartOfAccount({ ...duplicateData, createdBy: req.user?.id });
    await newAccount.save();

    res.status(201).json({ success: true, data: newAccount, message: 'Account duplicated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAccountTypes = async (req: Request, res: Response) => {
  try {
    const customTypes = await AccountType.find({ isActive: true }).sort({ name: 1 });
    
    const systemTypes = [
      { value: 'ASSET', label: 'Asset', description: 'Resources owned by the business', nature: 'debit', isSystem: true },
      { value: 'LIABILITY', label: 'Liability', description: 'Debts and obligations', nature: 'credit', isSystem: true },
      { value: 'EQUITY', label: 'Equity', description: 'Owner\'s equity and capital', nature: 'credit', isSystem: true },
      { value: 'REVENUE', label: 'Revenue', description: 'Income and sales', nature: 'credit', isSystem: true },
      { value: 'EXPENSE', label: 'Expense', description: 'Costs and expenses', nature: 'debit', isSystem: true }
    ];
    
    const allTypes = [
      ...systemTypes,
      ...customTypes.map(t => ({
        _id: t._id,
        value: t.value.toUpperCase(),
        label: t.name,
        description: t.description,
        nature: t.nature,
        isSystem: false
      }))
    ];
    
    res.json({ success: true, data: allTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccountType = async (req: Request, res: Response) => {
  try {
    const accountType = new AccountType({ ...req.body, createdBy: req.user?.id });
    await accountType.save();
    res.status(201).json({ success: true, data: accountType });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAccountType = async (req: Request, res: Response) => {
  try {
    const accountType = await AccountType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!accountType) {
      return res.status(404).json({ success: false, message: 'Account type not found' });
    }
    res.json({ success: true, data: accountType });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAccountType = async (req: Request, res: Response) => {
  try {
    const accountType = await AccountType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!accountType) {
      return res.status(404).json({ success: false, message: 'Account type not found' });
    }
    res.json({ success: true, data: accountType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

