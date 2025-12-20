import { Request, Response } from 'express';
import ChartOfAccount from '../models/ChartOfAccount';
import { AccountType } from '../models/AccountType';
import { generateEntryNumber } from '../utils/numberGenerator';
import { createContactFromAccount } from '../utils/accountContact';

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
    
    const account = new Account({ ...req.body, createdBy: req.user.id });
    await ChartOfAccount.save();
    
    // Auto-create contact if requested and account is customer/vendor type
    if (req.body.createContact) {
      try {
        await createContactFromAccount(ChartOfAccount._id.toString(), req.body, req.user.id);
      } catch (contactError) {
        logger.warn('Failed to auto-create contact', { 
          error: contactError instanceof Error ? contactError.message : 'Unknown',
          accountId: ChartOfAccount._id 
        });
      }
    }
    
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
    const accounts = await ChartOfAccount.find(filter)
      .populate('parentId', 'name code')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await ChartOfAccount.findById(req.params.id)
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

    // Prevent code changes if different
    if (req.body.code && existingAccount.code !== req.body.code) {
      console.warn(`Account code change attempted: ${existingAccount.code} to ${req.body.code}`);
      delete req.body.code; // Remove code from update
    }
    
    const account = await ChartOfAccount.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    // Auto-create contact if requested and account doesn't have one
    if (req.body.createContact && !account?.contactId && req.user) {
      try {
        await createContactFromAccount(ChartOfAccount._id.toString(), req.body, req.user.id);
      } catch (contactError) {
        logger.warn('Failed to auto-create contact on update', { 
          error: contactError instanceof Error ? contactError.message : 'Unknown',
          accountId: ChartOfAccount._id 
        });
      }
    }
    
    res.json({ success: true, data: account, message: 'Account updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const account = await ChartOfAccount.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
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

    const originalAccount = await ChartOfAccount.findById(req.params.id);
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
    // Get custom types from database
    const customTypes = await AccountType.find({ isActive: true }).sort({ name: 1 });
    
    // Default system types
    const systemTypes = [
      { value: 'asset', label: 'Asset', description: 'Resources owned by the business', nature: 'debit', isSystem: true },
      { value: 'liability', label: 'Liability', description: 'Debts and obligations', nature: 'credit', isSystem: true },
      { value: 'equity', label: 'Equity', description: 'Owner\'s equity and capital', nature: 'credit', isSystem: true },
      { value: 'revenue', label: 'Revenue', description: 'Income and sales', nature: 'credit', isSystem: true },
      { value: 'expense', label: 'Expense', description: 'Costs and expenses', nature: 'debit', isSystem: true }
    ];
    
    // Combine system and custom types
    const allTypes = [
      ...systemTypes,
      ...customTypes.map(t => ({
        _id: t._id,
        value: t.value,
        label: t.name,
        description: t.description,
        nature: t.nature,
        isSystem: false
      }))
    ];
    
    // Get count for each type
    const counts = await ChartOfAccount.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const typesWithCounts = allTypes.map(type => {
      const count = counts.find(c => c._id === type.value)?.count || 0;
      return { ...type, count };
    });
    
    res.json({ success: true, data: typesWithCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create custom account type
export const createAccountType = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name, description, nature } = req.body;
    
    // Validation
    if (!name || !nature) {
      return res.status(400).json({ success: false, message: 'Name and nature are required' });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ success: false, message: 'Name must be between 2 and 50 characters' });
    }

    if (!['debit', 'credit'].includes(nature)) {
      return res.status(400).json({ success: false, message: 'Nature must be debit or credit' });
    }

    if (description && description.length > 200) {
      return res.status(400).json({ success: false, message: 'Description must be less than 200 characters' });
    }

    // Sanitize and generate value from name
    const sanitizedName = name.trim();
    const value = sanitizedName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (!value) {
      return res.status(400).json({ success: false, message: 'Invalid account type name' });
    }

    // Check if type already exists
    const existing = await AccountType.findOne({ 
      $or: [
        { name: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } }, 
        { value }
      ] 
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Account type already exists' });
    }

    const accountType = new AccountType({
      name: sanitizedName,
      value,
      description: description?.trim(),
      nature,
      createdBy: req.user.id
    });

    await accountType.save();
    res.status(201).json({ success: true, data: accountType, message: 'Account type created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update account type
export const updateAccountType = async (req: Request, res: Response) => {
  try {
    const accountType = await AccountType.findById(req.params.id);
    if (!accountType) {
      return res.status(404).json({ success: false, message: 'Account type not found' });
    }

    if (accountType.isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot modify system account types' });
    }

    const { name, description, nature } = req.body;
    
    if (nature && !['debit', 'credit'].includes(nature)) {
      return res.status(400).json({ success: false, message: 'Nature must be debit or credit' });
    }

    if (name) accountType.name = name;
    if (description !== undefined) accountType.description = description;
    if (nature) accountType.nature = nature;

    await accountType.save();
    res.json({ success: true, data: accountType, message: 'Account type updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete account type
export const deleteAccountType = async (req: Request, res: Response) => {
  try {
    const accountType = await AccountType.findById(req.params.id);
    if (!accountType) {
      return res.status(404).json({ success: false, message: 'Account type not found' });
    }

    if (accountType.isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot delete system account types' });
    }

    // Check if any accounts use this type
    const accountsUsingType = await ChartOfAccount.countDocuments({ type: accountType.value });
    if (accountsUsingType > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete account type. ${accountsUsingType} accounts are using this type.` 
      });
    }

    accountType.isActive = false;
    await accountType.save();
    res.json({ success: true, message: 'Account type deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

