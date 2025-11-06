import { Request, Response } from 'express';
import UserAssignment from '../models/UserAssignment';
import { logger } from '../utils/logger';

// Get user assignments
export const getUserAssignments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const assignments = await UserAssignment.find({
      userId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).populate('assignedBy', 'name email');

    res.json(assignments);
  } catch (error: any) {
    logger.error(`Get user assignments error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, resourceType, resourceId, permissions, expiresAt } = req.body;
    
    // Check if assignment already exists
    const existing = await UserAssignment.findOne({
      userId,
      resourceType,
      resourceId,
      isActive: true
    });

    if (existing) {
      // Update existing assignment
      existing.permissions = permissions;
      existing.expiresAt = expiresAt;
      existing.assignedBy = (req as any).user.id;
      await existing.save();
      
      return res.json(existing);
    }

    // Create new assignment
    const assignment = await UserAssignment.create({
      userId,
      resourceType,
      resourceId,
      permissions,
      assignedBy: (req as any).user.id,
      expiresAt
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    logger.error(`Create assignment error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Remove assignment
export const removeAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    
    await UserAssignment.findByIdAndUpdate(assignmentId, {
      isActive: false
    });

    res.json({ message: 'Assignment removed successfully' });
  } catch (error: any) {
    logger.error(`Remove assignment error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Check user access
export const checkUserAccess = async (req: Request, res: Response) => {
  try {
    const { userId, resourceType, resourceId } = req.params;
    
    const assignment = await UserAssignment.findOne({
      userId,
      resourceType,
      resourceId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.json({
      hasAccess: !!assignment,
      permissions: assignment?.permissions || []
    });
  } catch (error: any) {
    logger.error(`Check user access error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};