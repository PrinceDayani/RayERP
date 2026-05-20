import { Request, Response } from 'express';
import FinancialEntry from '../models/FinancialEntry';
import Project from '../models/Project';
import Employee from '../models/Employee';

// Helper: Recalculate project financial progress
const recalculateProjectProgress = async (projectId: string) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    // Sum all approved payments made
    const paymentsMade = await FinancialEntry.aggregate([
      { 
        $match: { 
          project: project._id, 
          entryType: { $in: ['payment-made', 'expense'] },
          status: 'approved'
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Sum all approved payments received
    const paymentsReceived = await FinancialEntry.aggregate([
      { 
        $match: { 
          project: project._id, 
          entryType: 'payment-received',
          status: 'approved'
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalSpent = paymentsMade[0]?.total || 0;
    const totalReceived = paymentsReceived[0]?.total || 0;
    const budget = project.budget || 1; // avoid division by zero

    // Financial progress = payments made / budget * 100
    const financialProgress = Math.min(Math.round((totalSpent / budget) * 100), 100);

    // Department breakdown
    const deptBreakdown = await FinancialEntry.aggregate([
      { 
        $match: { 
          project: project._id, 
          status: 'approved',
          department: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$department',
          spent: { 
            $sum: { 
              $cond: [{ $in: ['$entryType', ['payment-made', 'expense']] }, '$amount', 0] 
            } 
          },
          received: { 
            $sum: { 
              $cond: [{ $eq: ['$entryType', 'payment-received'] }, '$amount', 0] 
            } 
          }
        }
      }
    ]);

    // Update project
    await Project.findByIdAndUpdate(projectId, {
      progress: financialProgress,
      spentBudget: totalSpent,
      financialProgress: {
        totalContractValue: budget,
        totalPaymentsMade: totalSpent,
        totalPaymentsReceived: totalReceived,
        financialProgress,
        lastUpdated: new Date(),
        departmentBreakdown: deptBreakdown.map(d => ({
          department: d._id,
          allocated: 0, // can be set separately
          spent: d.spent,
          received: d.received
        }))
      }
    });
  } catch (error) {
    console.error('Error recalculating project progress:', error);
  }
};

// Create a financial entry
export const createFinancialEntry = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { entryType, amount, currency, description, vendorOrClient, department, referenceNumber, date, attachments, category } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get employee record
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    const entry = new FinancialEntry({
      project: projectId,
      entryType,
      amount,
      currency: currency || project.currency,
      description,
      vendorOrClient,
      department,
      referenceNumber,
      date: new Date(date),
      reportedBy: employee._id,
      attachments: attachments || [],
      category: category || 'other',
      status: 'pending'
    });

    await entry.save();

    const populatedEntry = await FinancialEntry.findById(entry._id)
      .populate('reportedBy', 'firstName lastName')
      .populate('department', 'name');

    res.status(201).json({ success: true, data: populatedEntry });
  } catch (error: any) {
    console.error('Create financial entry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all financial entries for a project
export const getProjectFinancialEntries = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { entryType, category, status, startDate, endDate, department, page = 1, limit = 30 } = req.query;

    const filter: any = { project: projectId };

    if (entryType) filter.entryType = entryType;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (department) filter.department = department;

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate as string) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      FinancialEntry.find(filter)
        .populate('reportedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('department', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      FinancialEntry.countDocuments(filter)
    ]);

    // Calculate totals
    const totals = await FinancialEntry.aggregate([
      { $match: { ...filter, status: 'approved' } },
      {
        $group: {
          _id: '$entryType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: entries,
      totals: totals.reduce((acc, t) => ({ ...acc, [t._id]: { total: t.total, count: t.count } }), {}),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get financial entries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve a financial entry (manager action)
export const approveFinancialEntry = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, entryId } = req.params;

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    // Verify user is a manager of this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isManager = project.managers.some(m => m.toString() === employee._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    const userRole = user.role as any;
    const isAdmin = userRole?.level >= 80;

    if (!isManager && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project managers can approve financial entries' });
    }

    const entry = await FinancialEntry.findOneAndUpdate(
      { _id: entryId, project: projectId, status: 'pending' },
      { status: 'approved', approvedBy: employee._id, approvedAt: new Date() },
      { new: true }
    )
      .populate('reportedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('department', 'name');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found or already processed' });
    }

    // Recalculate project progress after approval
    await recalculateProjectProgress(projectId);

    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error('Approve financial entry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject a financial entry
export const rejectFinancialEntry = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, entryId } = req.params;
    const { reason } = req.body;

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    // Verify user is a manager
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isManager = project.managers.some(m => m.toString() === employee._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    const userRole = user.role as any;
    const isAdmin = userRole?.level >= 80;

    if (!isManager && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project managers can reject financial entries' });
    }

    const entry = await FinancialEntry.findOneAndUpdate(
      { _id: entryId, project: projectId, status: 'pending' },
      { status: 'rejected', rejectionReason: reason || 'No reason provided' },
      { new: true }
    )
      .populate('reportedBy', 'firstName lastName')
      .populate('department', 'name');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found or already processed' });
    }

    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error('Reject financial entry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get financial summary for a project
export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [paymentsMade, paymentsReceived, pendingEntries, categoryBreakdown] = await Promise.all([
      FinancialEntry.aggregate([
        { $match: { project: project._id, entryType: { $in: ['payment-made', 'expense'] }, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      FinancialEntry.aggregate([
        { $match: { project: project._id, entryType: 'payment-received', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      FinancialEntry.countDocuments({ project: project._id, status: 'pending' }),
      FinancialEntry.aggregate([
        { $match: { project: project._id, status: 'approved' } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const totalSpent = paymentsMade[0]?.total || 0;
    const totalReceived = paymentsReceived[0]?.total || 0;
    const budget = project.budget || 0;
    const financialProgress = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;

    res.json({
      success: true,
      data: {
        budget,
        currency: project.currency,
        totalSpent,
        totalReceived,
        remaining: budget - totalSpent,
        financialProgress,
        pendingEntries,
        paymentsMadeCount: paymentsMade[0]?.count || 0,
        paymentsReceivedCount: paymentsReceived[0]?.count || 0,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c._id,
          total: c.total,
          count: c.count,
          percentage: budget > 0 ? Math.round((c.total / budget) * 100) : 0
        }))
      }
    });
  } catch (error: any) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a financial entry (only pending, by the reporter)
export const deleteFinancialEntry = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, entryId } = req.params;

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    const entry = await FinancialEntry.findOne({ _id: entryId, project: projectId });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    if (entry.reportedBy.toString() !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own entries' });
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending entries can be deleted' });
    }

    await FinancialEntry.findByIdAndDelete(entryId);
    res.json({ success: true, message: 'Financial entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete financial entry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export financial entries as CSV
export const exportFinancialEntries = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, status } = req.query;

    const filter: any = { project: projectId };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    if (status) filter.status = status;

    const entries = await FinancialEntry.find(filter)
      .populate('reportedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('department', 'name')
      .sort({ date: -1 });

    // Build CSV
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Vendor/Client', 'Reference', 'Status', 'Reported By', 'Department'];
    const rows = entries.map(e => [
      new Date(e.date).toISOString().split('T')[0],
      e.entryType,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount.toString(),
      e.currency,
      e.vendorOrClient || '',
      e.referenceNumber || '',
      e.status,
      e.reportedBy ? `${(e.reportedBy as any).firstName} ${(e.reportedBy as any).lastName}` : '',
      e.department ? (e.department as any).name : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=financial-entries-${projectId}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export financial entries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
