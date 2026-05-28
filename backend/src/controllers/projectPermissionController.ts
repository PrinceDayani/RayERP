import { Request, Response } from 'express';
import ProjectPermission from '../models/ProjectPermission';
import { logActivity } from '../utils/activityLogger';

export const getProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const permissions = await ProjectPermission.find({ project: projectId })
      .populate('user', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project permissions' });
  }
};

export const setProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    // Accept either `userId` or legacy `employeeId` from request body
    const targetUserId = req.body.userId || req.body.employeeId;
    const { permissions } = req.body;
    const actingUserId = (req as any).user?.id;

    if (!targetUserId || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'User ID and permissions array are required'
      });
    }

    const existingPermission = await ProjectPermission.findOne({
      project: projectId,
      user: targetUserId
    });

    let result;
    if (existingPermission) {
      existingPermission.permissions = permissions;
      existingPermission.createdBy = actingUserId;
      result = await existingPermission.save();
    } else {
      result = await ProjectPermission.create({
        project: projectId,
        user: targetUserId,
        permissions,
        createdBy: actingUserId
      });
    }

    await result.populate('user', 'name email');

    await logActivity({
      userId: actingUserId,
      userName: (req as any).user?.name || 'Unknown',
      action: existingPermission ? 'update' : 'create',
      resource: 'Project Permissions',
      resourceType: 'project',
      resourceId: projectId,
      projectId,
      details: `${existingPermission ? 'Updated' : 'Set'} project permissions`,
      metadata: { projectId, userId: targetUserId, permissions }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error setting project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to set project permissions' });
  }
};

export const removeProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const targetUserId = req.params.userId || req.params.employeeId;
    const actingUserId = (req as any).user?.id;

    const result = await ProjectPermission.findOneAndDelete({
      project: projectId,
      user: targetUserId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Project permissions not found'
      });
    }

    await logActivity({
      userId: actingUserId,
      userName: (req as any).user?.name || 'Unknown',
      action: 'delete',
      resource: 'Project Permissions',
      resourceType: 'project',
      resourceId: projectId,
      projectId,
      details: 'Removed project permissions',
      metadata: { projectId, userId: targetUserId }
    });

    res.json({ success: true, message: 'Project permissions removed successfully' });
  } catch (error) {
    console.error('Error removing project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to remove project permissions' });
  }
};

export const getEmployeeProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const targetUserId = req.params.userId || req.params.employeeId;

    const permission = await ProjectPermission.findOne({
      project: projectId,
      user: targetUserId
    }).populate('user', 'name email');

    res.json({
      success: true,
      data: permission ? permission.permissions : []
    });
  } catch (error) {
    console.error('Error fetching project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project permissions' });
  }
};
