import { Request, Response } from 'express';
import BOQ, { IBOQ, IBOQItem } from '../models/BOQ';
import Project from '../models/Project';
import { hasProjectAccess } from '../modules/projects/permissions/permissionController';
import { 
  calculateItemProgress, 
  calculateItemAmount, 
  analyzeVariance, 
  forecastCostToComplete,
  calculateMilestoneProgress,
  getCategoryBreakdown,
  validateBOQItem
} from '../utils/boqCalculations';

export const createBOQ = async (req: Request, res: Response) => {
  try {
    const { projectId, items, currency } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to create BOQ for this project' });
    }
    
    const latestBOQ = await BOQ.findOne({ project: projectId }).sort({ version: -1 });
    const version = latestBOQ ? latestBOQ.version + 1 : 1;
    
    const processedItems = items.map((item: Partial<IBOQItem>) => {
      const errors = validateBOQItem(item);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      return {
        ...item,
        plannedAmount: calculateItemAmount(item.plannedQuantity!, item.unitRate!),
        actualAmount: calculateItemAmount(item.actualQuantity || 0, item.unitRate!),
        completionPercentage: calculateItemProgress(item as IBOQItem),
        currency: item.currency || currency || 'USD'
      };
    });
    
    const boq = new BOQ({
      project: projectId,
      version,
      items: processedItems,
      currency: currency || 'USD',
      createdBy: req.user?.userId
    });
    
    await boq.save();
    
    res.status(201).json({ message: 'BOQ created successfully', boq });
  } catch (error: any) {
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating BOQ', error: error.message });
  }
};

export const getBOQsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, version } = req.query;
    
    const hasAccess = await hasProjectAccess(req.user?.userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view BOQs for this project' });
    }
    
    const query: any = { project: projectId };
    if (status) query.status = status;
    if (version) query.version = version;
    
    const boqs = await BOQ.find(query)
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ version: -1 });
    
    res.json({ boqs });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching BOQs', error: error.message });
  }
};

export const getBOQById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const boq = await BOQ.findById(id)
      .populate('project', 'name status budget currency')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    res.json({ boq });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching BOQ', error: error.message });
  }
};

export const updateBOQItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const updates = req.body;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, boq.project.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to update this BOQ' });
    }
    
    if (boq.status === 'closed') {
      return res.status(400).json({ message: 'Cannot update closed BOQ' });
    }
    
    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'BOQ item not found' });
    }
    
    Object.assign(item, updates);
    
    if (updates.actualQuantity !== undefined || updates.unitRate !== undefined) {
      item.actualAmount = calculateItemAmount(item.actualQuantity, item.unitRate);
      item.completionPercentage = calculateItemProgress(item);
    }
    
    await boq.save();
    
    res.json({ message: 'BOQ item updated successfully', boq });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating BOQ item', error: error.message });
  }
};

export const addBOQItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    if (boq.status === 'closed') {
      return res.status(400).json({ message: 'Cannot add items to closed BOQ' });
    }
    
    const errors = validateBOQItem(itemData);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    const newItem = {
      ...itemData,
      plannedAmount: calculateItemAmount(itemData.plannedQuantity, itemData.unitRate),
      actualAmount: calculateItemAmount(itemData.actualQuantity || 0, itemData.unitRate),
      completionPercentage: calculateItemProgress(itemData as IBOQItem)
    };
    
    boq.items.push(newItem);
    await boq.save();
    
    res.status(201).json({ message: 'BOQ item added successfully', boq });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding BOQ item', error: error.message });
  }
};

export const deleteBOQItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    if (boq.status === 'closed') {
      return res.status(400).json({ message: 'Cannot delete items from closed BOQ' });
    }
    
    boq.items.pull(itemId);
    await boq.save();
    
    res.json({ message: 'BOQ item deleted successfully', boq });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting BOQ item', error: error.message });
  }
};

export const approveBOQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, boq.project.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to approve this BOQ' });
    }
    
    if (boq.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft BOQs can be approved' });
    }
    
    boq.status = 'approved';
    boq.approvedBy = req.user?.userId;
    boq.approvedDate = new Date();
    
    await boq.save();
    
    res.json({ message: 'BOQ approved successfully', boq });
  } catch (error: any) {
    res.status(500).json({ message: 'Error approving BOQ', error: error.message });
  }
};

export const activateBOQ = async (req: Request, res: Response) => {
  const session = await BOQ.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    const boq = await BOQ.findById(id).session(session);
    if (!boq) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, boq.project.toString());
    if (!hasAccess) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied: You do not have permission to activate this BOQ' });
    }
    
    if (boq.status !== 'approved') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Only approved BOQs can be activated' });
    }
    
    await BOQ.updateMany(
      { project: boq.project, status: 'active' },
      { status: 'revised' }
    ).session(session);
    
    boq.status = 'active';
    await boq.save({ session });
    
    await session.commitTransaction();
    
    res.json({ message: 'BOQ activated successfully', boq });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error activating BOQ', error: error.message });
  } finally {
    session.endSession();
  }
};

export const getVarianceAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const analysis = analyzeVariance(boq.items);
    
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ message: 'Error analyzing variance', error: error.message });
  }
};

export const getCostForecast = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const forecast = forecastCostToComplete(boq);
    
    res.json({ forecast });
  } catch (error: any) {
    res.status(500).json({ message: 'Error forecasting cost', error: error.message });
  }
};

export const getMilestoneProgress = async (req: Request, res: Response) => {
  try {
    const { id, milestoneId } = req.params;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const progress = calculateMilestoneProgress(boq.items, milestoneId);
    
    res.json({ milestoneId, progress });
  } catch (error: any) {
    res.status(500).json({ message: 'Error calculating milestone progress', error: error.message });
  }
};

export const getCategoryBreakdownReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const boq = await BOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const breakdown = getCategoryBreakdown(boq.items);
    
    res.json({ breakdown });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating category breakdown', error: error.message });
  }
};
