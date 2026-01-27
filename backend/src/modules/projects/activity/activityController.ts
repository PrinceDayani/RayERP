import { Request, Response } from 'express';
import Project from '../../../models/Project';

export const getProjectActivity = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { resourceType, page = 1, limit = 50 } = req.query;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const ActivityLog = (await import('../../../models/ActivityLog')).default;
    
    const query: any = { projectId };
    if (resourceType) query.resourceType = resourceType;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching project activity:', error);
    res.status(500).json({ message: 'Error fetching project activity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
