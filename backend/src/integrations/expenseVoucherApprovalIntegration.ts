import mongoose from 'mongoose';
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';

// Expense Integration
export const createExpenseWithApproval = async (expense: any, userId: string, session: any) => {
  if (requiresApproval(expense.amount, 10000)) {
    expense.status = 'PENDING_APPROVAL';
    await expense.save({ session });

    const approval = await createApprovalRequest(
      'EXPENSE',
      expense._id,
      `Expense: ${expense.description}`,
      expense.amount,
      new mongoose.Types.ObjectId(userId),
      expense.description,
      { category: expense.category }
    );

    expense.approvalId = approval._id;
    await expense.save({ session });
    return { expense, approval, requiresApproval: true };
  }

  expense.status = 'APPROVED';
  expense.approvedBy = new mongoose.Types.ObjectId(userId);
  expense.approvedAt = new Date();
  await expense.save({ session });
  return { expense, requiresApproval: false };
};

export const handleExpenseApprovalComplete = async (approvalId: any, status: string, userId: any, reason?: string) => {
  const ApprovalRequest = require('../models/ApprovalRequest').default;
  const Expense = require('../models/Expense').default;

  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval || approval.entityType !== 'EXPENSE') return;

  const expense = await Expense.findById(approval.entityId);
  if (!expense) return;

  expense.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  if (status === 'APPROVED') {
    expense.approvedBy = userId;
    expense.approvedAt = new Date();
  } else {
    expense.rejectionReason = reason;
  }
  await expense.save();
};

// Voucher Integration
export const createVoucherWithApproval = async (voucher: any, userId: string, session: any) => {
  if (requiresApproval(voucher.amount, 10000)) {
    voucher.status = 'PENDING_APPROVAL';
    await voucher.save({ session });

    const approval = await createApprovalRequest(
      'VOUCHER',
      voucher._id,
      `Voucher ${voucher.voucherNumber}`,
      voucher.amount,
      new mongoose.Types.ObjectId(userId),
      voucher.description,
      { voucherNumber: voucher.voucherNumber, voucherType: voucher.voucherType }
    );

    voucher.approvalId = approval._id;
    await voucher.save({ session });
    return { voucher, approval, requiresApproval: true };
  }

  voucher.status = 'APPROVED';
  voucher.approvedBy = new mongoose.Types.ObjectId(userId);
  voucher.approvedAt = new Date();
  await voucher.save({ session });
  return { voucher, requiresApproval: false };
};

export const handleVoucherApprovalComplete = async (approvalId: any, status: string, userId: any, reason?: string) => {
  const ApprovalRequest = require('../models/ApprovalRequest').default;
  const Voucher = require('../models/Voucher').default;

  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval || approval.entityType !== 'VOUCHER') return;

  const voucher = await Voucher.findById(approval.entityId);
  if (!voucher) return;

  voucher.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  if (status === 'APPROVED') {
    voucher.approvedBy = userId;
    voucher.approvedAt = new Date();
  } else {
    voucher.rejectionReason = reason;
  }
  await voucher.save();
};
