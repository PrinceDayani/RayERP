import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import { UserRole } from '../models/User';

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Root user has access to everything
    if ((user.role as string) === 'root') {
      return next();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check access permissions
    const hasAccess = 
      (user.role as string) === 'root' ||
      project.owner.toString() === user._id.toString() ||
      project.members.some(memberId => memberId.toString() === user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Project access middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const checkProjectManagementAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Only root and super_admin can manage projects
    if ((user.role as string) !== 'root' && (user.role as string) !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Project management access middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};