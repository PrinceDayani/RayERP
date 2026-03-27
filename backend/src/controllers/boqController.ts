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

export const getAllBOQs = async (req: Request, res: Response) => {
  try {
    const { status, projectId, page = '1', limit = '50' } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (projectId) query.project = projectId;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const [boqs, total] = await Promise.all([
      BOQ.find(query)
        .populate('project', 'name status')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      BOQ.countDocuments(query)
    ]);
    
    res.json({ 
      boqs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching BOQs', error: error.message });
  }
};

export const createBOQ = async (req: Request, res: Response) => {
  const session = await BOQ.startSession();
  session.startTransaction();
  
  try {
    const { projectId, items, currency } = req.body;
    
    const project = await Project.findById(projectId).session(session);
    if (!project) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, projectId);
    if (!hasAccess) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied: You do not have permission to create BOQ for this project' });
    }
    
    const boqCurrency = currency || project.currency || 'USD';
    if (project.currency && boqCurrency !== project.currency) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: `Currency mismatch: BOQ currency (${boqCurrency}) must match project currency (${project.currency})` 
      });
    }
    
    const latestBOQ = await BOQ.findOne({ project: projectId }).sort({ version: -1 }).session(session);
    const version = latestBOQ ? latestBOQ.version + 1 : 1;
    
    const itemCodes = new Set<string>();
    const processedItems = items.map((item: Partial<IBOQItem>) => {
      const errors = validateBOQItem(item);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      if (itemCodes.has(item.itemCode!)) {
        throw new Error(`Duplicate item code: ${item.itemCode}`);
      }
      itemCodes.add(item.itemCode!);
      
      return {
        ...item,
        plannedAmount: calculateItemAmount(item.plannedQuantity!, item.unitRate!),
        actualAmount: calculateItemAmount(item.actualQuantity || 0, item.unitRate!),
        completionPercentage: calculateItemProgress(item as IBOQItem),
        currency: item.currency || boqCurrency
      };
    });
    
    const totalPlannedAmount = processedItems.reduce((sum, item) => sum + item.plannedAmount, 0);
    if (project.budget && totalPlannedAmount > project.budget) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: `BOQ total (${totalPlannedAmount}) exceeds project budget (${project.budget})` 
      });
    }
    
    const boq = new BOQ({
      project: projectId,
      version,
      items: processedItems,
      currency: boqCurrency,
      createdBy: req.user?.userId,
      auditTrail: [{
        action: 'created',
        performedBy: req.user?.userId,
        timestamp: new Date(),
        notes: `BOQ version ${version} created`
      }]
    });
    
    await boq.save({ session });
    await session.commitTransaction();
    
    res.status(201).json({ message: 'BOQ created successfully', boq });
  } catch (error: any) {
    await session.abortTransaction();
    if (error.message.includes('Validation failed') || error.message.includes('Duplicate') || error.message.includes('exceeds')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating BOQ', error: error.message });
  } finally {
    session.endSession();
  }
};

export const getBOQsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, version, page = '1', limit = '50' } = req.query;
    
    const hasAccess = await hasProjectAccess(req.user?.userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view BOQs for this project' });
    }
    
    const query: any = { project: projectId };
    if (status) query.status = status;
    if (version) query.version = version;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const [boqs, total] = await Promise.all([
      BOQ.find(query)
        .populate('project', 'name')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ version: -1 })
        .skip(skip)
        .limit(limitNum),
      BOQ.countDocuments(query)
    ]);
    
    res.json({ 
      boqs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
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
  const session = await BOQ.startSession();
  session.startTransaction();
  
  try {
    const { id, itemId } = req.params;
    const updates = req.body;
    
    const boq = await BOQ.findById(id).session(session);
    if (!boq) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, boq.project.toString());
    if (!hasAccess) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied: You do not have permission to update this BOQ' });
    }
    
    if (boq.status === 'closed') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot update closed BOQ' });
    }
    
    if (boq.status === 'approved' || boq.status === 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot update approved or active BOQ. Create a new version instead.' });
    }
    
    const item = boq.items.id(itemId);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ item not found' });
    }
    
    if (updates.itemCode && updates.itemCode !== item.itemCode) {
      const duplicate = boq.items.find(i => i._id?.toString() !== itemId && i.itemCode === updates.itemCode);
      if (duplicate) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Duplicate item code: ${updates.itemCode}` });
      }
    }
    
    const oldItem = { ...item.toObject() };
    Object.assign(item, updates);
    
    if (updates.actualQuantity !== undefined || updates.unitRate !== undefined) {
      item.actualAmount = calculateItemAmount(item.actualQuantity, item.unitRate);
      item.completionPercentage = calculateItemProgress(item);
    }
    
    boq.auditTrail.push({
      action: 'item_updated',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      itemId: itemId,
      changes: { old: oldItem, new: item.toObject() }
    });
    
    await boq.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'BOQ item updated successfully', boq });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error updating BOQ item', error: error.message });
  } finally {
    session.endSession();
  }
};

export const addBOQItem = async (req: Request, res: Response) => {
  const session = await BOQ.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    const boq = await BOQ.findById(id).session(session);
    if (!boq) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    if (boq.status === 'closed') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot add items to closed BOQ' });
    }
    
    if (boq.status === 'approved' || boq.status === 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot add items to approved or active BOQ. Create a new version instead.' });
    }
    
    const errors = validateBOQItem(itemData);
    if (errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    const duplicate = boq.items.find(item => item.itemCode === itemData.itemCode);
    if (duplicate) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Duplicate item code: ${itemData.itemCode}` });
    }
    
    const newItem = {
      ...itemData,
      plannedAmount: calculateItemAmount(itemData.plannedQuantity, itemData.unitRate),
      actualAmount: calculateItemAmount(itemData.actualQuantity || 0, itemData.unitRate),
      completionPercentage: calculateItemProgress(itemData as IBOQItem)
    };
    
    boq.items.push(newItem);
    
    boq.auditTrail.push({
      action: 'item_added',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      itemId: newItem.itemCode,
      notes: `Added item: ${newItem.description}`
    });
    
    await boq.save({ session });
    await session.commitTransaction();
    
    res.status(201).json({ message: 'BOQ item added successfully', boq });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error adding BOQ item', error: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteBOQItem = async (req: Request, res: Response) => {
  const session = await BOQ.startSession();
  session.startTransaction();
  
  try {
    const { id, itemId } = req.params;
    
    const boq = await BOQ.findById(id).session(session);
    if (!boq) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    if (boq.status === 'closed') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot delete items from closed BOQ' });
    }
    
    if (boq.status === 'approved' || boq.status === 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot delete items from approved or active BOQ. Create a new version instead.' });
    }
    
    const item = boq.items.id(itemId);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ item not found' });
    }
    
    const deletedItem = { ...item.toObject() };
    boq.items.pull(itemId);
    
    boq.auditTrail.push({
      action: 'item_deleted',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      itemId: itemId,
      changes: deletedItem
    });
    
    await boq.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'BOQ item deleted successfully', boq });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error deleting BOQ item', error: error.message });
  } finally {
    session.endSession();
  }
};

export const approveBOQ = async (req: Request, res: Response) => {
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
      return res.status(403).json({ message: 'Access denied: You do not have permission to approve this BOQ' });
    }
    
    if (boq.status !== 'draft') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Only draft BOQs can be approved' });
    }
    
    boq.status = 'approved';
    boq.approvedBy = req.user?.userId;
    boq.approvedDate = new Date();
    
    boq.auditTrail.push({
      action: 'approved',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      notes: `BOQ version ${boq.version} approved`
    });
    
    await boq.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'BOQ approved successfully', boq });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error approving BOQ', error: error.message });
  } finally {
    session.endSession();
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
    
    boq.auditTrail.push({
      action: 'activated',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      notes: `BOQ version ${boq.version} activated`
    });
    
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

export const getAuditTrail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;
    
    const boq = await BOQ.findById(id)
      .populate('auditTrail.performedBy', 'name email')
      .select('auditTrail version status');
    
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const total = boq.auditTrail.length;
    const paginatedTrail = boq.auditTrail
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(skip, skip + limitNum);
    
    res.json({ 
      auditTrail: paginatedTrail,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching audit trail', error: error.message });
  }
};
