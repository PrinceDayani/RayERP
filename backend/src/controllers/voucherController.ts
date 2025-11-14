import { Request, Response } from 'express';
import { Voucher, VoucherType } from '../models/Voucher';
import { Account } from '../models/Account';
import { JournalEntry } from '../models/JournalEntry';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const VOUCHER_PREFIXES: Record<VoucherType, string> = {
  payment: 'PAY',
  receipt: 'REC',
  contra: 'CON',
  sales: 'SAL',
  purchase: 'PUR',
  journal: 'JOU',
  debit_note: 'DN',
  credit_note: 'CN'
};

const generateVoucherNumber = async (type: VoucherType, fiscalYear?: string): Promise<string> => {
  const prefix = VOUCHER_PREFIXES[type];
  const year = fiscalYear || new Date().getFullYear().toString().slice(-2);
  const pattern = new RegExp(`^${prefix}${year}`);
  
  const last = await Voucher.findOne({ 
    voucherType: type,
    voucherNumber: pattern
  }).sort({ voucherNumber: -1 });
  
  const num = last ? parseInt(last.voucherNumber.slice(-6)) + 1 : 1;
  return `${prefix}${year}${num.toString().padStart(6, '0')}`;
};

export const createVoucher = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      voucherType, date, reference, narration, lines, 
      partyId, partyName, paymentMode, chequeNumber, chequeDate,
      bankAccountId, invoiceNumber, invoiceDate, dueDate,
      taxAmount, discountAmount, attachments 
    } = req.body;
    
    const userId = (req as any).user?.id;

    if (!lines || lines.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'At least one line item required' });
    }

    const totalDebit = lines.reduce((sum: number, l: any) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Total debits must equal total credits' });
    }

    for (const line of lines) {
      const account = await Account.findById(line.accountId).session(session);
      if (!account) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Invalid account: ${line.accountId}` });
      }
      if (!account.isActive) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Account ${account.name} is inactive` });
      }
    }

    const voucherNumber = await generateVoucherNumber(voucherType);
    
    const voucher = await Voucher.create([{
      voucherType,
      voucherNumber,
      date: new Date(date),
      reference,
      narration,
      lines,
      totalAmount: totalDebit,
      partyId,
      partyName,
      paymentMode,
      chequeNumber,
      chequeDate: chequeDate ? new Date(chequeDate) : undefined,
      bankAccountId,
      invoiceNumber,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      attachments: attachments || [],
      status: 'draft',
      createdBy: userId
    }], { session });

    await session.commitTransaction();
    
    const populatedVoucher = await Voucher.findById(voucher[0]._id)
      .populate('lines.accountId', 'code name type')
      .populate('partyId', 'code name')
      .populate('bankAccountId', 'code name')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedVoucher });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Create voucher error:', error);
    res.status(500).json({ message: error.message || 'Error creating voucher' });
  } finally {
    session.endSession();
  }
};

export const getVouchers = async (req: Request, res: Response) => {
  try {
    const { 
      voucherType, status, startDate, endDate, partyId, 
      search, page = 1, limit = 50 
    } = req.query;
    
    const query: any = {};
    
    if (voucherType) query.voucherType = voucherType;
    if (status) query.status = status;
    if (partyId) query.partyId = partyId;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    if (search) {
      query.$or = [
        { voucherNumber: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { narration: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .populate('lines.accountId', 'code name type')
        .populate('partyId', 'code name')
        .populate('bankAccountId', 'code name')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ date: -1, voucherNumber: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Voucher.countDocuments(query)
    ]);

    res.json({ 
      success: true, 
      data: vouchers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get vouchers error:', error);
    res.status(500).json({ message: 'Error fetching vouchers' });
  }
};

export const getVoucherById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const voucher = await Voucher.findById(id)
      .populate('lines.accountId', 'code name type balance')
      .populate('lines.departmentId', 'name')
      .populate('lines.projectId', 'name')
      .populate('partyId', 'code name contactInfo bankDetails')
      .populate('bankAccountId', 'code name bankDetails')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('cancelledBy', 'name email');

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    res.json({ success: true, data: voucher });
  } catch (error) {
    logger.error('Get voucher error:', error);
    res.status(500).json({ message: 'Error fetching voucher' });
  }
};

export const updateVoucher = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const voucher = await Voucher.findById(id).session(session);

    if (!voucher) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.status === 'posted') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot update posted voucher' });
    }

    if (voucher.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot update cancelled voucher' });
    }

    const { lines, ...updateData } = req.body;

    if (lines && lines.length > 0) {
      const totalDebit = lines.reduce((sum: number, l: any) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum: number, l: any) => sum + (l.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Total debits must equal total credits' });
      }

      updateData.lines = lines;
      updateData.totalAmount = totalDebit;
    }

    Object.assign(voucher, updateData);
    await voucher.save({ session });

    await session.commitTransaction();

    const updatedVoucher = await Voucher.findById(id)
      .populate('lines.accountId', 'code name type')
      .populate('partyId', 'code name')
      .populate('bankAccountId', 'code name')
      .populate('createdBy', 'name email');

    res.json({ success: true, data: updatedVoucher });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Update voucher error:', error);
    res.status(500).json({ message: error.message || 'Error updating voucher' });
  } finally {
    session.endSession();
  }
};

export const postVoucher = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    const voucher = await Voucher.findById(id).session(session);

    if (!voucher) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.status === 'posted') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Voucher already posted' });
    }

    if (voucher.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot post cancelled voucher' });
    }

    for (const line of voucher.lines) {
      const account = await Account.findById(line.accountId).session(session);
      if (!account) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Account not found: ${line.accountId}` });
      }

      let balanceChange = 0;
      if (['asset', 'expense'].includes(account.type)) {
        balanceChange = line.debit - line.credit;
      } else {
        balanceChange = line.credit - line.debit;
      }

      account.balance += balanceChange;
      await account.save({ session });
    }

    const journalLines = voucher.lines.map(line => ({
      accountId: line.accountId,
      debit: line.debit,
      credit: line.credit,
      description: line.description || voucher.narration,
      costCenter: line.costCenter,
      departmentId: line.departmentId,
      projectId: line.projectId
    }));

    const entryNumber = `JE-${voucher.voucherNumber}`;
    await JournalEntry.create([{
      entryNumber,
      voucherType: voucher.voucherType,
      date: voucher.date,
      reference: voucher.reference || voucher.voucherNumber,
      description: voucher.narration,
      lines: journalLines,
      totalDebit: voucher.totalAmount,
      totalCredit: voucher.totalAmount,
      isPosted: true,
      createdBy: userId
    }], { session });

    voucher.isPosted = true;
    voucher.status = 'posted';
    voucher.approvedBy = userId;
    voucher.approvedAt = new Date();
    await voucher.save({ session });

    await session.commitTransaction();

    res.json({ success: true, message: 'Voucher posted successfully', data: voucher });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Post voucher error:', error);
    res.status(500).json({ message: error.message || 'Error posting voucher' });
  } finally {
    session.endSession();
  }
};

export const cancelVoucher = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;
    
    const voucher = await Voucher.findById(id).session(session);

    if (!voucher) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Voucher already cancelled' });
    }

    if (voucher.status === 'posted') {
      for (const line of voucher.lines) {
        const account = await Account.findById(line.accountId).session(session);
        if (account) {
          let balanceChange = 0;
          if (['asset', 'expense'].includes(account.type)) {
            balanceChange = -(line.debit - line.credit);
          } else {
            balanceChange = -(line.credit - line.debit);
          }
          account.balance += balanceChange;
          await account.save({ session });
        }
      }
    }

    voucher.status = 'cancelled';
    voucher.cancelledBy = userId;
    voucher.cancelledAt = new Date();
    voucher.cancellationReason = reason || 'No reason provided';
    await voucher.save({ session });

    await session.commitTransaction();

    res.json({ success: true, message: 'Voucher cancelled successfully', data: voucher });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Cancel voucher error:', error);
    res.status(500).json({ message: error.message || 'Error cancelling voucher' });
  } finally {
    session.endSession();
  }
};

export const deleteVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findById(id);

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.status === 'posted') {
      return res.status(400).json({ message: 'Cannot delete posted voucher. Cancel it first.' });
    }

    await Voucher.findByIdAndDelete(id);
    res.json({ success: true, message: 'Voucher deleted successfully' });
  } catch (error) {
    logger.error('Delete voucher error:', error);
    res.status(500).json({ message: 'Error deleting voucher' });
  }
};

export const getVoucherStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};
    
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate as string);
      if (endDate) dateFilter.date.$lte = new Date(endDate as string);
    }

    const stats = await Voucher.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$voucherType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          posted: { $sum: { $cond: [{ $eq: ['$status', 'posted'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const summary = {
      payment: stats.find(s => s._id === 'payment') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      receipt: stats.find(s => s._id === 'receipt') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      contra: stats.find(s => s._id === 'contra') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      sales: stats.find(s => s._id === 'sales') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      purchase: stats.find(s => s._id === 'purchase') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      journal: stats.find(s => s._id === 'journal') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      debit_note: stats.find(s => s._id === 'debit_note') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 },
      credit_note: stats.find(s => s._id === 'credit_note') || { count: 0, totalAmount: 0, posted: 0, draft: 0, cancelled: 0 }
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Get voucher stats error:', error);
    res.status(500).json({ message: 'Error fetching voucher statistics' });
  }
};
