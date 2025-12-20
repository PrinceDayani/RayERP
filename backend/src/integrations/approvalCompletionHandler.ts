import mongoose from 'mongoose';
import { handlePaymentApprovalComplete } from './paymentApprovalIntegration';
import { handleInvoiceApprovalComplete } from './invoiceApprovalIntegration';
import { handleJournalApprovalComplete } from './journalApprovalIntegration';
import { handleExpenseApprovalComplete, handleVoucherApprovalComplete } from './expenseVoucherApprovalIntegration';
import { sendApprovalApprovedEmail, sendApprovalRejectedEmail } from '../utils/approvalEmailService';
import { emitApprovalApproved, emitApprovalRejected } from '../socket/approvalSocket';
import { io } from '../server';

export const handleApprovalCompletion = async (
  approvalId: mongoose.Types.ObjectId,
  status: 'APPROVED' | 'REJECTED',
  userId: mongoose.Types.ObjectId,
  reason?: string
) => {
  const ApprovalRequest = require('../models/ApprovalRequest').default;
  const User = require('../models/User').default;

  const approval = await ApprovalRequest.findById(approvalId).populate('requestedBy');
  if (!approval) return;

  // Update entity based on type
  switch (approval.entityType) {
    case 'PAYMENT':
      await handlePaymentApprovalComplete(approvalId, status, userId, reason);
      break;
    case 'INVOICE':
      await handleInvoiceApprovalComplete(approvalId, status, userId, reason);
      break;
    case 'JOURNAL':
      await handleJournalApprovalComplete(approvalId, status, userId, reason);
      break;
    case 'EXPENSE':
      await handleExpenseApprovalComplete(approvalId, status, userId, reason);
      break;
    case 'VOUCHER':
      await handleVoucherApprovalComplete(approvalId, status, userId, reason);
      break;
  }

  // Send email notification
  const requester = approval.requestedBy;
  if (status === 'APPROVED') {
    await sendApprovalApprovedEmail(requester.email, requester.name, approval);
    emitApprovalApproved(io, approval);
  } else {
    await sendApprovalRejectedEmail(requester.email, requester.name, approval, reason || '');
    emitApprovalRejected(io, approval);
  }
};

export default { handleApprovalCompletion };
