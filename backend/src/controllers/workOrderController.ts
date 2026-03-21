import { Request, Response } from 'express';
import WorkOrder from '../models/WorkOrder';
import Project from '../models/Project';
import Contact from '../models/Contact';
import { hasProjectAccess } from '../modules/projects/permissions/permissionController';

const generateWONumber = async (): Promise<string> => {
  const count = await WorkOrder.countDocuments();
  return `WO-${String(count + 1).padStart(5, '0')}`;
};

export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const {
      projectId, subcontractorId, boqId, title, description,
      items, totalAmount, retentionPercentage, currency,
      startDate, endDate, paymentTerms, notes
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const hasAccess = await hasProjectAccess(req.user?._id, projectId);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const subcontractor = await Contact.findById(subcontractorId);
    if (!subcontractor) return res.status(404).json({ message: 'Subcontractor not found' });

    const woNumber = await generateWONumber();

    const workOrder = new WorkOrder({
      woNumber,
      project: projectId,
      subcontractor: subcontractorId,
      subcontractorName: subcontractor.name,
      boq: boqId || undefined,
      title,
      description,
      items: items || [],
      totalAmount,
      retentionPercentage: retentionPercentage || 0,
      currency: currency || 'INR',
      startDate,
      endDate,
      paymentTerms,
      notes,
      createdBy: req.user?._id
    });

    await workOrder.save();
    res.status(201).json({ message: 'Work order created', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating work order', error: error.message });
  }
};

export const getWorkOrdersByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const hasAccess = await hasProjectAccess(req.user?._id, projectId);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const query: any = { project: projectId };
    if (status) query.status = status;

    const workOrders = await WorkOrder.find(query)
      .populate('project', 'name')
      .populate('subcontractor', 'name phone email company')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ workOrders });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching work orders', error: error.message });
  }
};

export const getWorkOrderById = async (req: Request, res: Response) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('project', 'name status currency')
      .populate('subcontractor', 'name phone email company address')
      .populate('boq', 'version overallProgress')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('payments.recordedBy', 'name email');

    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });
    res.json({ workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching work order', error: error.message });
  }
};

export const updateWorkOrder = async (req: Request, res: Response) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    const hasAccess = await hasProjectAccess(req.user?._id, workOrder.project.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    if (['closed', 'cancelled'].includes(workOrder.status)) {
      return res.status(400).json({ message: 'Cannot update closed or cancelled work order' });
    }

    Object.assign(workOrder, req.body);
    await workOrder.save();
    res.json({ message: 'Work order updated', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating work order', error: error.message });
  }
};

export const submitWorkOrderForApproval = async (req: Request, res: Response) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    if (workOrder.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft work orders can be submitted' });
    }

    workOrder.status = 'pending-approval';
    workOrder.approvalStatus = 'pending';
    await workOrder.save();
    res.json({ message: 'Work order submitted for approval', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error submitting work order', error: error.message });
  }
};

export const approveWorkOrder = async (req: Request, res: Response) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    const hasAccess = await hasProjectAccess(req.user?._id, workOrder.project.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    if (workOrder.status !== 'pending-approval') {
      return res.status(400).json({ message: 'Only pending work orders can be approved' });
    }

    workOrder.status = 'approved';
    workOrder.approvalStatus = 'approved';
    workOrder.approvedBy = req.user?._id;
    workOrder.approvedDate = new Date();
    await workOrder.save();
    res.json({ message: 'Work order approved', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error approving work order', error: error.message });
  }
};

export const rejectWorkOrder = async (req: Request, res: Response) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    if (workOrder.status !== 'pending-approval') {
      return res.status(400).json({ message: 'Only pending work orders can be rejected' });
    }

    workOrder.status = 'draft';
    workOrder.approvalStatus = 'rejected';
    workOrder.rejectionReason = req.body.rejectionReason;
    await workOrder.save();
    res.json({ message: 'Work order rejected', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error rejecting work order', error: error.message });
  }
};

export const issueWorkOrder = async (req: Request, res: Response) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    if (workOrder.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved work orders can be issued' });
    }

    workOrder.status = 'issued';
    await workOrder.save();
    res.json({ message: 'Work order issued', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error issuing work order', error: error.message });
  }
};

export const updateWorkOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    const hasAccess = await hasProjectAccess(req.user?._id, workOrder.project.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const validTransitions: Record<string, string[]> = {
      'issued': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': ['closed']
    };

    const allowed = validTransitions[workOrder.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${workOrder.status} to ${status}` });
    }

    workOrder.status = status;
    await workOrder.save();
    res.json({ message: `Work order status updated to ${status}`, workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

export const recordWorkOrderPayment = async (req: Request, res: Response) => {
  try {
    const { amount, paymentDate, paymentReference, paymentMethod, notes } = req.body;

    if (!amount || amount <= 0 || !isFinite(amount)) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) return res.status(404).json({ message: 'Work order not found' });

    const hasAccess = await hasProjectAccess(req.user?._id, workOrder.project.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    if (!['issued', 'in-progress', 'completed'].includes(workOrder.status)) {
      return res.status(400).json({ message: 'Payments can only be recorded for issued/in-progress/completed work orders' });
    }

    const newTotalPaid = workOrder.totalPaid + amount;
    if (newTotalPaid > workOrder.totalAmount) {
      return res.status(400).json({
        message: 'Payment exceeds outstanding balance',
        outstanding: workOrder.totalAmount - workOrder.totalPaid,
        attempted: amount
      });
    }

    workOrder.payments.push({
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentReference,
      paymentMethod: paymentMethod || 'bank-transfer',
      notes,
      recordedBy: req.user?._id
    });

    workOrder.totalPaid = newTotalPaid;
    await workOrder.save();
    res.json({ message: 'Payment recorded', workOrder });
  } catch (error: any) {
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
};

export const getWorkOrderAnalytics = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const hasAccess = await hasProjectAccess(req.user?._id, projectId);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const workOrders = await WorkOrder.find({ project: projectId });

    const analytics = {
      totalWorkOrders: workOrders.length,
      totalContractValue: workOrders.reduce((s, w) => s + w.totalAmount, 0),
      totalPaid: workOrders.reduce((s, w) => s + w.totalPaid, 0),
      totalOutstanding: workOrders.reduce((s, w) => s + w.totalOutstanding, 0),
      totalRetention: workOrders.reduce((s, w) => s + w.retentionAmount, 0),
      byStatus: {
        draft: workOrders.filter(w => w.status === 'draft').length,
        pendingApproval: workOrders.filter(w => w.status === 'pending-approval').length,
        approved: workOrders.filter(w => w.status === 'approved').length,
        issued: workOrders.filter(w => w.status === 'issued').length,
        inProgress: workOrders.filter(w => w.status === 'in-progress').length,
        completed: workOrders.filter(w => w.status === 'completed').length,
        closed: workOrders.filter(w => w.status === 'closed').length,
        cancelled: workOrders.filter(w => w.status === 'cancelled').length
      }
    };

    res.json({ analytics });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};
