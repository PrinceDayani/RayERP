import { Request, Response } from 'express';
import { Settings } from '../models/Settings';
import ChartOfAccount from '../models/ChartOfAccount';
import { PartyLedger } from '../models/PartyLedger';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Per-user preferences moved to /api/settings/me (see userPreferenceController).
// These handlers now serve only the organisation-wide singleton, which is why
// they can stay behind the settings.view / settings.edit permissions.

// accountingMode is deliberately absent: it is changed through the dedicated
// switch-mode / convert-* endpoints so the ledger side effects always run.
const EDITABLE_SETTING_FIELDS = [
  'companyName',
  'fiscalYearStart',
  'currency',
  'currencyConfig',
  'projectSettings'
] as const;

export const getSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ accountingMode: 'western' });
    }
    res.json(settings);
  } catch (error: any) {
    logger.error(`Get settings error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    // Copy only known fields off the body; passing req.body straight into the
    // update would let a caller set anything the schema happens to accept.
    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_SETTING_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No editable settings fields supplied' });
    }

    if (updates.currency !== undefined && !/^[A-Z]{3}$/.test(String(updates.currency).toUpperCase())) {
      return res.status(400).json({ message: 'currency must be a three-letter ISO 4217 code' });
    }

    if (updates.fiscalYearStart !== undefined && !/^\d{2}-\d{2}$/.test(String(updates.fiscalYearStart))) {
      return res.status(400).json({ message: 'fiscalYearStart must be in DD-MM format' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    logger.info('Organisation settings updated', {
      userId: (req as any).user?._id?.toString(),
      fields: Object.keys(updates)
    });

    res.json(settings);
  } catch (error: any) {
    logger.error(`Update settings error: ${error.message}`);
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

