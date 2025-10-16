import { Request, Response } from 'express';
import Account from '../models/Account';

export const createAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const account = new Account({ ...req.body, createdBy: req.user.id });
    await account.save();
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const filter: any = { isActive: true };
    if (projectId) filter.projectId = projectId;
    
    const accounts = await Account.find(filter)
      .populate('parentAccount', 'name code')
      .populate('projectId', 'name');
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('parentAccount', 'name code')
      .populate('projectId', 'name');
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
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
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