import { Request, Response } from 'express';
import LeavePolicy from './LeavePolicy';
import { LEAVE_TYPES } from '../../hr/leave/Leave';
import { logger } from '../../../utils/logger';

// Readable by everyone: staff see their quotas when applying for leave.
export const getLeavePolicy = async (_req: Request, res: Response) => {
  try {
    const policy = await LeavePolicy.getPolicy();
    res.json({ success: true, data: { types: policy.types, excludeNonWorkingDays: policy.excludeNonWorkingDays, updatedAt: policy.updatedAt } });
  } catch (error: any) {
    logger.error('Get leave policy error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error fetching leave policy' });
  }
};

// Applies to balances from now on; leaves already approved keep their day counts.
export const updateLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { types, excludeNonWorkingDays } = req.body || {};
    const policy = await LeavePolicy.getPolicy();

    if (types !== undefined) {
      if (!Array.isArray(types)) return res.status(400).json({ success: false, message: 'types must be a list' });
      const next = [];
      for (const t of types) {
        if (!LEAVE_TYPES.includes(t?.type)) return res.status(400).json({ success: false, message: `Unknown leave type ${t?.type}` });
        if (next.some(n => n.type === t.type)) return res.status(400).json({ success: false, message: `Leave type ${t.type} appears twice` });
        const annualQuota = Number(t.annualQuota);
        const maxCarryForward = Number(t.maxCarryForward ?? 0);
        if (!Number.isFinite(annualQuota) || annualQuota < 0 || annualQuota > 366) {
          return res.status(400).json({ success: false, message: `${t.type}: annual quota must be 0 to 366 days` });
        }
        if (!Number.isFinite(maxCarryForward) || maxCarryForward < 0 || maxCarryForward > 366) {
          return res.status(400).json({ success: false, message: `${t.type}: carry-forward cap must be 0 to 366 days` });
        }
        next.push({ type: t.type, annualQuota, carryForward: t.carryForward === true, maxCarryForward });
      }
      // Types left out keep their current settings, so every type always has a quota.
      policy.types = LEAVE_TYPES.map(type => next.find(n => n.type === type) || policy.types.find(p => p.type === type)!) as any;
    }
    if (excludeNonWorkingDays !== undefined) policy.excludeNonWorkingDays = excludeNonWorkingDays === true;
    policy.updatedBy = req.user._id;

    await policy.save();
    LeavePolicy.invalidateCache();
    logger.info('Leave policy updated', { userId: req.user._id.toString() });
    res.json({ success: true, data: { types: policy.types, excludeNonWorkingDays: policy.excludeNonWorkingDays, updatedAt: policy.updatedAt } });
  } catch (error: any) {
    logger.error('Update leave policy error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error updating leave policy' });
  }
};
