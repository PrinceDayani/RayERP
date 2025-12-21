import { Request, Response } from 'express';
import { Settings } from '../models/Settings';
import ChartOfAccount from '../models/ChartOfAccount';
import { PartyLedger } from '../models/PartyLedger';
import mongoose from 'mongoose';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ accountingMode: 'western' });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findOneAndUpdate({}, req.body, { new: true });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const switchAccountingMode = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { mode } = req.body;
    
    if (!['western', 'indian'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode. Use "western" or "indian"' });
    }

    let settings = await Settings.findOne().session(session);
    if (!settings) {
      const [newSettings] = await Settings.create([{ accountingMode: mode }], { session });
      settings = newSettings;
    } else {
      settings.accountingMode = mode;
      await settings.save({ session });
    }

    await session.commitTransaction();
    res.json({ message: `Switched to ${mode} accounting mode`, settings });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const convertToIndianMode = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const accounts = await ChartOfAccount.find({ isActive: true }).session(session);
    let converted = 0;

    for (const account of accounts) {
      const existingParty = await PartyLedger.findOne({ accountId: account._id }).session(session);
      
      if (!existingParty && ['ASSET', 'LIABILITY'].includes(account.type.toUpperCase())) {
        await PartyLedger.create([{
          code: account.code,
          name: account.name,
          accountId: account._id,
          currentBalance: account.balance,
          openingBalance: account.openingBalance,
          balanceType: account.type.toUpperCase() === 'ASSET' ? 'debit' : 'credit',
          currency: account.currency || 'INR',
          isActive: account.isActive
        }], { session });
        converted++;
      }
    }

    let settings = await Settings.findOne().session(session);
    if (!settings) {
      const [newSettings] = await Settings.create([{ accountingMode: 'indian' }], { session });
      settings = newSettings;
    } else {
      settings.accountingMode = 'indian';
      await settings.save({ session });
    }

    await session.commitTransaction();
    res.json({ 
      message: `Converted ${converted} accounts to Indian mode with party ledgers`,
      converted,
      settings 
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const convertToWesternMode = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    let settings = await Settings.findOne().session(session);
    if (!settings) {
      const [newSettings] = await Settings.create([{ accountingMode: 'western' }], { session });
      settings = newSettings;
    } else {
      settings.accountingMode = 'western';
      await settings.save({ session });
    }

    await session.commitTransaction();
    res.json({ 
      message: 'Switched to Western mode. Party ledgers preserved for reference.',
      settings 
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

