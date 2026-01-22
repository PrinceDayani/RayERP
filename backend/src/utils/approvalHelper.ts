import ApprovalRequest from '../models/ApprovalRequest';
import ApprovalConfig from '../models/ApprovalConfig';
import mongoose from 'mongoose';

/**
 * Helper function to determine approval levels based on amount
 */
export const determineApprovalLevels = async (amount: number, entityType: string) => {
  const config = await ApprovalConfig.findOne({ entityType, isActive: true });
  if (!config) throw new Error('Approval configuration not found');
  return config.levels
    .filter(level => amount >= level.amountThreshold || level.level === 1)
    .map(level => ({
      level: level.level,
      approverRole: level.approverRole,
      approverIds: [],
      amountThreshold: level.amountThreshold,
      status: 'PENDING'
    }));
};

/**
 * Helper function to determine priority based on amount
 */
export const determinePriority = (amount: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (amount > 200000) return 'HIGH';
  if (amount > 50000) return 'MEDIUM';
  return 'LOW';
};

/**
 * Create approval request for any entity
 */
export const createApprovalRequest = async (
  entityType: 'JOURNAL' | 'PAYMENT' | 'INVOICE' | 'EXPENSE' | 'VOUCHER',
  entityId: mongoose.Types.ObjectId,
  title: string,
  amount: number,
  requestedBy: mongoose.Types.ObjectId,
  description?: string,
  metadata?: any
) => {
  const levels = await determineApprovalLevels(amount, entityType);
  const priority = determinePriority(amount);

  const approval = new ApprovalRequest({
    entityType,
    entityId,
    title,
    description,
    amount,
    requestedBy,
    approvalLevels: levels,
    totalLevels: levels.length,
    priority,
    metadata
  });

  await approval.save();
  return approval;
};

/**
 * Check if entity requires approval
 */
export const requiresApproval = (amount: number, threshold = 10000): boolean => {
  return amount >= threshold;
};

/**
 * Get approval status for entity
 */
export const getApprovalStatus = async (
  entityType: string,
  entityId: mongoose.Types.ObjectId
) => {
  const approval = await ApprovalRequest.findOne({ entityType, entityId });
  return approval?.status || null;
};

/**
 * Check if user can approve at current level
 */
export const canUserApprove = async (
  approvalId: mongoose.Types.ObjectId,
  userRole: string
): Promise<boolean> => {
  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval || approval.status !== 'PENDING') return false;

  const currentLevel = approval.approvalLevels.find(
    l => l.level === approval.currentLevel
  );
  
  return currentLevel?.approverRole === userRole && currentLevel.status === 'PENDING';
};

export default {
  determineApprovalLevels,
  determinePriority,
  createApprovalRequest,
  requiresApproval,
  getApprovalStatus,
  canUserApprove
};
