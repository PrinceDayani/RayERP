import mongoose from 'mongoose';
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';

export const createJournalWithApproval = async (journal: any, userId: string, session: any) => {
  const totalAmount = journal.totalDebit || journal.totalCredit || 0;
  
  if (requiresApproval(totalAmount, 10000)) {
    journal.status = 'PENDING_APPROVAL';
    await journal.save({ session });

    const approval = await createApprovalRequest(
      'JOURNAL',
      journal._id,
      `Journal Entry ${journal.entryNumber}`,
      totalAmount,
      new mongoose.Types.ObjectId(userId),
      journal.description,
      { entryNumber: journal.entryNumber, entryType: journal.entryType }
    );

    journal.approvalId = approval._id;
    await journal.save({ session });
    return { journal, approval, requiresApproval: true };
  }

  journal.status = 'APPROVED';
  journal.approvedBy = new mongoose.Types.ObjectId(userId);
  journal.approvedAt = new Date();
  await journal.save({ session });
  return { journal, requiresApproval: false };
};

export const handleJournalApprovalComplete = async (approvalId: any, status: string, userId: any, reason?: string) => {
  const ApprovalRequest = require('../models/ApprovalRequest').default;
  const JournalEntry = require('../models/JournalEntry').default;

  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval || approval.entityType !== 'JOURNAL') return;

  const journal = await JournalEntry.findById(approval.entityId);
  if (!journal) return;

  journal.status = status === 'APPROVED' ? 'POSTED' : 'REJECTED';
  if (status === 'APPROVED') {
    journal.approvedBy = userId;
    journal.approvedAt = new Date();
    journal.isPosted = true;
  } else {
    journal.rejectionReason = reason;
  }
  await journal.save();
};
