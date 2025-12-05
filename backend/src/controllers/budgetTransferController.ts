import { Request, Response } from 'express';
import BudgetTransfer from '../models/BudgetTransfer';
import Budget from '../models/Budget';
import mongoose from 'mongoose';

// Generate transfer number
const generateTransferNumber = async (): Promise<string> => {
  const count = await BudgetTransfer.countDocuments();
  return `BT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

// Create budget transfer request
export const createTransferRequest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromBudgetId, toBudgetId, amount, reason, notes } = req.body;
    const userId = req.user?.id;

    // Validate budgets exist
    const [fromBudget, toBudget] = await Promise.all([
      Budget.findById(fromBudgetId).session(session),
      Budget.findById(toBudgetId).session(session)
    ]);

    if (!fromBudget || !toBudget) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Validate same fiscal year
    if (fromBudget.fiscalYear !== toBudget.fiscalYear) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Budgets must be in same fiscal year' });
    }

    // Validate available balance
    const availableBalance = (fromBudget as any).totalAmount - (fromBudget as any).allocatedAmount;
    if (amount > availableBalance) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Insufficient available balance',
        available: availableBalance,
        requested: amount
      });
    }

    // Create transfer request
    const transferNumber = await generateTransferNumber();
    const transfer = await BudgetTransfer.create([{
      transferNumber,
      fromBudget: fromBudgetId,
      toBudget: toBudgetId,
      amount,
      reason,
      notes,
      requestedBy: userId,
      status: 'pending'
    }], { session });

    await session.commitTransaction();
    
    const populatedTransfer = await BudgetTransfer.findById(transfer[0]._id)
      .populate('fromBudget', 'budgetName departmentId')
      .populate('toBudget', 'budgetName departmentId')
      .populate('requestedBy', 'name email');

    res.status(201).json({
      message: 'Transfer request created successfully',
      transfer: populatedTransfer
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error creating transfer request', error: error.message });
  } finally {
    session.endSession();
  }
};

// Approve transfer request
export const approveTransfer = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transferId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    const transfer = await BudgetTransfer.findById(transferId).session(session);
    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Transfer already processed' });
    }

    // Get budgets
    const [fromBudget, toBudget] = await Promise.all([
      Budget.findById(transfer.fromBudget).session(session),
      Budget.findById(transfer.toBudget).session(session)
    ]);

    if (!fromBudget || !toBudget) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Validate balance again
    const availableBalance = (fromBudget as any).totalAmount - (fromBudget as any).allocatedAmount;
    if (transfer.amount > availableBalance) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance at approval time' });
    }

    // Execute transfer
    (fromBudget as any).totalAmount -= transfer.amount;
    (toBudget as any).totalAmount += transfer.amount;

    await Promise.all([
      fromBudget.save({ session }),
      toBudget.save({ session })
    ]);

    // Update transfer status
    transfer.status = 'completed';
    transfer.approvedBy = new mongoose.Types.ObjectId(userId);
    transfer.approvalDate = new Date();
    transfer.completionDate = new Date();
    if (notes) transfer.notes = notes;
    await transfer.save({ session });

    await session.commitTransaction();

    const populatedTransfer = await BudgetTransfer.findById(transferId)
      .populate('fromBudget', 'budgetName departmentId totalAmount')
      .populate('toBudget', 'budgetName departmentId totalAmount')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      message: 'Transfer approved and completed successfully',
      transfer: populatedTransfer
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error approving transfer', error: error.message });
  } finally {
    session.endSession();
  }
};

// Reject transfer request
export const rejectTransfer = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user?.id;

    const transfer = await BudgetTransfer.findById(transferId);
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer already processed' });
    }

    transfer.status = 'rejected';
    transfer.approvedBy = new mongoose.Types.ObjectId(userId);
    transfer.approvalDate = new Date();
    transfer.rejectionReason = rejectionReason;
    await transfer.save();

    const populatedTransfer = await BudgetTransfer.findById(transferId)
      .populate('fromBudget', 'budgetName departmentId')
      .populate('toBudget', 'budgetName departmentId')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      message: 'Transfer rejected successfully',
      transfer: populatedTransfer
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error rejecting transfer', error: error.message });
  }
};

// Get all transfers
export const getAllTransfers = async (req: Request, res: Response) => {
  try {
    const { status, fromBudget, toBudget, fiscalYear } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (fromBudget) filter.fromBudget = fromBudget;
    if (toBudget) filter.toBudget = toBudget;

    const transfers = await BudgetTransfer.find(filter)
      .populate('fromBudget', 'budgetName departmentId fiscalYear')
      .populate('toBudget', 'budgetName departmentId fiscalYear')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ transfers, count: transfers.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching transfers', error: error.message });
  }
};

// Get transfer by ID
export const getTransferById = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    const transfer = await BudgetTransfer.findById(transferId)
      .populate('fromBudget', 'budgetName departmentId fiscalYear totalAmount allocatedAmount')
      .populate('toBudget', 'budgetName departmentId fiscalYear totalAmount allocatedAmount')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json({ transfer });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching transfer', error: error.message });
  }
};

// Get pending transfers
export const getPendingTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await BudgetTransfer.find({ status: 'pending' })
      .populate('fromBudget', 'budgetName departmentId')
      .populate('toBudget', 'budgetName departmentId')
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ transfers, count: transfers.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching pending transfers', error: error.message });
  }
};

// Get transfer history for a budget
export const getBudgetTransferHistory = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;

    const transfers = await BudgetTransfer.find({
      $or: [{ fromBudget: budgetId }, { toBudget: budgetId }],
      status: 'completed'
    })
      .populate('fromBudget', 'budgetName departmentId')
      .populate('toBudget', 'budgetName departmentId')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ completionDate: -1 });

    res.json({ transfers, count: transfers.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching transfer history', error: error.message });
  }
};
