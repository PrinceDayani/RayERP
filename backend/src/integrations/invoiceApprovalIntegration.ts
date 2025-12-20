import mongoose from 'mongoose';
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';

export const createInvoiceWithApproval = async (invoice: any, userId: string, session: any) => {
  if (requiresApproval(invoice.totalAmount, 10000)) {
    invoice.status = 'PENDING_APPROVAL';
    await invoice.save({ session });

    const approval = await createApprovalRequest(
      'INVOICE',
      invoice._id,
      `Invoice ${invoice.invoiceNumber}`,
      invoice.totalAmount,
      new mongoose.Types.ObjectId(userId),
      invoice.description,
      { customerId: invoice.customerId, invoiceNumber: invoice.invoiceNumber }
    );

    invoice.approvalId = approval._id;
    await invoice.save({ session });
    return { invoice, approval, requiresApproval: true };
  }

  invoice.status = 'APPROVED';
  invoice.approvedBy = new mongoose.Types.ObjectId(userId);
  invoice.approvedAt = new Date();
  await invoice.save({ session });
  return { invoice, requiresApproval: false };
};

export const handleInvoiceApprovalComplete = async (approvalId: any, status: string, userId: any, reason?: string) => {
  const ApprovalRequest = require('../models/ApprovalRequest').default;
  const Invoice = require('../models/Invoice').default;

  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval || approval.entityType !== 'INVOICE') return;

  const invoice = await Invoice.findById(approval.entityId);
  if (!invoice) return;

  invoice.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  if (status === 'APPROVED') {
    invoice.approvedBy = userId;
    invoice.approvedAt = new Date();
  } else {
    invoice.rejectionReason = reason;
  }
  await invoice.save();
};
