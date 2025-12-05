import { Request, Response } from 'express';
import Budget from '../models/Budget';
import mongoose from 'mongoose';

// Create new revision of approved budget
export const createRevision = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { budgetId } = req.params;
    const { reason, changes } = req.body;

    const originalBudget = await Budget.findById(budgetId);
    if (!originalBudget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (originalBudget.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved budgets can be revised' });
    }

    // Mark original as not latest
    originalBudget.isLatestVersion = false;
    await originalBudget.save();

    // Create new version
    const newVersion = new Budget({
      ...originalBudget.toObject(),
      _id: new mongoose.Types.ObjectId(),
      budgetVersion: originalBudget.budgetVersion + 1,
      previousVersionId: originalBudget._id,
      isLatestVersion: true,
      status: 'draft',
      approvals: [],
      revisionHistory: [
        ...originalBudget.revisionHistory,
        {
          version: originalBudget.budgetVersion,
          revisedBy: new mongoose.Types.ObjectId(req.user.id),
          revisedAt: new Date(),
          reason,
          changes
        }
      ]
    });

    // Apply changes if provided
    if (changes) {
      if (changes.totalBudget) newVersion.totalBudget = changes.totalBudget;
      if (changes.categories) newVersion.categories = changes.categories;
    }

    await newVersion.save();

    res.status(201).json({
      success: true,
      data: newVersion,
      message: `Revision v${newVersion.budgetVersion} created successfully`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all versions of a budget
export const getBudgetVersions = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Get all versions in the chain
    const versions = [];
    let currentId = budget.isLatestVersion ? budget._id : budget.previousVersionId;
    
    while (currentId) {
      const version = await Budget.findById(currentId);
      if (!version) break;
      
      versions.unshift(version);
      currentId = version.previousVersionId;
    }

    // If current budget is latest, add it
    if (budget.isLatestVersion && !versions.find(v => v._id.equals(budget._id))) {
      versions.push(budget);
    }

    res.json({ success: true, data: versions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Compare two versions
export const compareVersions = async (req: Request, res: Response) => {
  try {
    const { budgetId, versionId } = req.params;

    const [current, previous] = await Promise.all([
      Budget.findById(budgetId),
      Budget.findById(versionId)
    ]);

    if (!current || !previous) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    const comparison = {
      totalBudget: {
        old: previous.totalBudget,
        new: current.totalBudget,
        change: current.totalBudget - previous.totalBudget,
        changePercent: ((current.totalBudget - previous.totalBudget) / previous.totalBudget) * 100
      },
      categories: {
        added: current.categories.filter(c => !previous.categories.find(p => p.name === c.name)),
        removed: previous.categories.filter(p => !current.categories.find(c => c.name === p.name)),
        modified: current.categories.filter(c => {
          const prev = previous.categories.find(p => p.name === c.name);
          return prev && prev.allocatedAmount !== c.allocatedAmount;
        }).map(c => {
          const prev = previous.categories.find(p => p.name === c.name)!;
          return {
            name: c.name,
            oldAmount: prev.allocatedAmount,
            newAmount: c.allocatedAmount,
            change: c.allocatedAmount - prev.allocatedAmount
          };
        })
      },
      metadata: {
        currentVersion: current.budgetVersion,
        previousVersion: previous.budgetVersion,
        revisedBy: current.revisionHistory[current.revisionHistory.length - 1]?.revisedBy,
        revisedAt: current.revisionHistory[current.revisionHistory.length - 1]?.revisedAt,
        reason: current.revisionHistory[current.revisionHistory.length - 1]?.reason
      }
    };

    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore old version
export const restoreVersion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { budgetId, versionId } = req.params;
    const { reason } = req.body;

    const [current, oldVersion] = await Promise.all([
      Budget.findById(budgetId),
      Budget.findById(versionId)
    ]);

    if (!current || !oldVersion) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    // Mark current as not latest
    current.isLatestVersion = false;
    await current.save();

    // Create new version from old
    const restored = new Budget({
      ...oldVersion.toObject(),
      _id: new mongoose.Types.ObjectId(),
      budgetVersion: current.budgetVersion + 1,
      previousVersionId: current._id,
      isLatestVersion: true,
      status: 'draft',
      approvals: [],
      revisionHistory: [
        ...current.revisionHistory,
        {
          version: current.budgetVersion,
          revisedBy: new mongoose.Types.ObjectId(req.user.id),
          revisedAt: new Date(),
          reason: reason || `Restored from version ${oldVersion.budgetVersion}`,
          changes: { restored: true, fromVersion: oldVersion.budgetVersion }
        }
      ]
    });

    await restored.save();

    res.json({
      success: true,
      data: restored,
      message: `Restored to version ${oldVersion.budgetVersion}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get revision history
export const getRevisionHistory = async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findById(req.params.budgetId)
      .populate('revisionHistory.revisedBy', 'name email')
      .populate('revisionHistory.approvedBy', 'name email');

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.json({ success: true, data: budget.revisionHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createRevision,
  getBudgetVersions,
  compareVersions,
  restoreVersion,
  getRevisionHistory
};
