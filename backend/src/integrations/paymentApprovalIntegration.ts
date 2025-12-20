import mongoose from 'mongoose';
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';

export const createPaymentWithApproval = async (payment: any, userId: string, session: any) => {
  if (requiresApproval(payment.amount, 10000)) {
    payment.status = 'PENDING_APPROVAL';
    await payment.save({ session });

    const approval = await createApprovalRequest(
      'PAYMENT',
      payment._id,
      `Payment to ${payment.vendorName}`,
      payment.amount,
      new mongoose.Types.ObjectId(userId),
      payment.description,
      { vendorId: payment.vendorId }
    );

    payment.approvalId = approval._id;
    await payment.save({ session });
    return { payment, approval, requiresApproval: true };
  }

  payment.status = 'APPROVED';
  payment.approvedBy = new mongoose.Types.ObjectId(userId);
  payment.approvedAt = new Date();
  await payment.save({ session });
  return { payment, requiresApproval: false };
};

export const handlePaymentApprovalComplete = async (approvalId: any, status: string, userId: any, reason?: string) => {
  const ApprovalRequest = require('../models/ApprovalRequest').default;
  const Payment = require('../models/Payment').default;

  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval || approval.entityType !== 'PAYMENT') return;

  const payment = await Payment.findById(approval.entityId);
  if (!payment) return;

  payment.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  if (status === 'APPROVED') {
    payment.approvedBy = userId;
    payment.approvedAt = new Date();
  } else {
    payment.rejectionReason = reason;
  }
  await payment.save();
};
