import { Request, Response } from 'express';
import ProjectPermission from '../models/ProjectPermission';
import { logActivity } from '../utils/activityLogger';

export const getProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const permissions = await ProjectPermission.find({ project: projectId })
      .populate('employee', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    
    res.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project permissions' });
  }
};

export const setProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { employeeId, permissions } = req.body;
    const userId = (req as any).user?.id;

    if (!employeeId || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and permissions array are required' 
      });
    }

    const existingPermission = await ProjectPermission.findOne({
      project: projectId,
      employee: employeeId
    });

    let result;
    if (existingPermission) {
      existingPermission.permissions = permissions;
      existingPermission.createdBy = userId;
      result = await existingPermission.save();
    } else {
      result = await ProjectPermission.create({
        project: projectId,
        employee: employeeId,
        permissions,
        createdBy: userId
      });
    }

    await result.populate('employee', 'firstName lastName email');
    
    await logActivity({
      userId,
      action: existingPermission ? 'UPDATE' : 'CREATE',
      module: 'PROJECT_PERMISSIONS',
      details: `${existingPermission ? 'Updated' : 'Set'} project permissions for employee`,
      metadata: { projectId, employeeId, permissions }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error setting project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to set project permissions' });
  }
};

export const removeProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, employeeId } = req.params;
    const userId = (req as any).user?.id;

    const result = await ProjectPermission.findOneAndDelete({
      project: projectId,
      employee: employeeId
    });

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project permissions not found' 
      });
    }

    await logActivity({
      userId,
      action: 'DELETE',
      module: 'PROJECT_PERMISSIONS',
      details: 'Removed project permissions for employee',
      metadata: { projectId, employeeId }
    });

    res.json({ success: true, message: 'Project permissions removed successfully' });
  } catch (error) {
    console.error('Error removing project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to remove project permissions' });
  }
};

export const getEmployeeProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, employeeId } = req.params;
    
    const permission = await ProjectPermission.findOne({
      project: projectId,
      employee: employeeId
    }).populate('employee', 'firstName lastName email');
    
    res.json({ 
      success: true, 
      data: permission ? permission.permissions : [] 
    });
  } catch (error) {
    console.error('Error fetching employee project permissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee project permissions' });
  }
};