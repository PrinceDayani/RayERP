import { Request, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { generateJournalEntryNumber } from '../utils/journalNumberGenerator';
import JournalTemplate from '../models/JournalTemplate';
import AllocationRule from '../models/AllocationRule';
import Account from '../models/ChartOfAccount';
import DepartmentBudget from '../models/DepartmentBudget';

// Recurring Journal Entries
export const generateRecurringEntries = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const recurringEntries = await JournalEntry.find({
      isRecurring: true,
      nextEntryDate: { $lte: today },
      $or: [{ recurringEndDate: { $gte: today } }, { recurringEndDate: null }]
    });

    const generated = [];
    for (const parent of recurringEntries) {
      const entryNumber = await generateJournalEntryNumber('RECURRING', 'GL');
      const newEntry = new JournalEntry({
        ...parent.toObject(),
        _id: undefined,
        entryNumber,
        parentEntryId: parent._id,
        date: new Date(),
        isPosted: false,
        createdAt: new Date()
      });
      
      await newEntry.save();
      
      const nextDate = calculateNextDate(parent.nextRecurringDate!, parent.recurringFrequency!);
      parent.nextRecurringDate = nextDate;
      await parent.save();
      
      generated.push(newEntry);
    }

    res.json({ success: true, count: generated.length, data: generated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reversing Entries
export const createReversingEntry = async (req: Request, res: Response) => {
  try {
    const original = await JournalEntry.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const reversedLines = original.lines.map(line => ({
      ...line,
      debit: line.credit,
      credit: line.debit,
      description: `Reversal: ${line.description}`
    }));

    const entryNumber = await generateJournalEntryNumber('REVERSING', 'GL');
    const reversingEntry = new JournalEntry({
      entryNumber,
      entryType: 'REVERSING',
      entryDate: req.body.reverseDate || new Date(),
      date: req.body.reverseDate || new Date(),
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      description: `Reversal of ${original.entryNumber}`,
      lines: reversedLines,
      totalDebit: original.totalDebit,
      totalCredit: original.totalCredit,
      isReversing: true,
      reversedEntryId: original._id,
      createdBy: req.user?.id || original.createdBy
    });

    await reversingEntry.save();
    
    original.reversedBy = req.user?.id || original.createdBy;
    original.reversalReason = 'Manual reversal';
    await original.save();

    res.json({ success: true, data: reversingEntry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create from Template
export const createFromTemplate = async (req: Request, res: Response) => {
  try {
    const template = await JournalTemplate.findById(req.params.templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const { date, reference, variables } = req.body;
    
    const lines = template.lines.map(line => {
      let debit = 0, credit = 0;
      
      if (line.debitFormula && variables) {
        debit = evaluateFormula(line.debitFormula, variables);
      }
      if (line.creditFormula && variables) {
        credit = evaluateFormula(line.creditFormula, variables);
      }
      
      return {
        accountId: line.accountId,
        debit,
        credit,
        description: line.description
      };
    });

    const entryNumber = await generateJournalEntryNumber('MANUAL', 'GL');
    const entry = new JournalEntry({
      entryNumber,
      date: date || new Date(),
      reference,
      description: template.description || template.name,
      lines,
      templateId: template._id,
      templateName: template.name,
      createdBy: req.user?.id
    });

    await entry.save();
    
    template.usageCount += 1;
    await template.save();

    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Batch Import
export const batchImport = async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid entries data' });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < entries.length; i++) {
      try {
        const entry = new JournalEntry({
          ...entries[i],
          createdBy: req.user?.id
        });
        await entry.save();
        created.push(entry);
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply Allocation Rule
export const applyAllocationRule = async (req: Request, res: Response) => {
  try {
    const rule = await AllocationRule.findById(req.params.ruleId);
    if (!rule || !rule.isActive) {
      return res.status(404).json({ success: false, message: 'Allocation rule not found or inactive' });
    }

    const { amount, date, description } = req.body;
    
    const lines = rule.targets.map(target => ({
      accountId: target.accountId,
      debit: 0,
      credit: (amount * target.percentage) / 100,
      description: `${description} - ${target.percentage}%`,
      departmentId: target.departmentId,
      projectId: target.projectId,
      allocationPercentage: target.percentage
    }));

    lines.unshift({
      accountId: rule.sourceAccountId,
      debit: amount,
      credit: 0,
      description: description,
      departmentId: undefined as any,
      projectId: undefined as any,
      allocationPercentage: 0
    });

    const entry = new JournalEntry({
      date: date || new Date(),
      description: `Allocation: ${rule.name}`,
      lines,
      hasAllocation: true,
      allocationRuleId: rule._id,
      createdBy: req.user?.id
    });

    await entry.save();
    
    rule.lastRunDate = new Date();
    await rule.save();

    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approval Workflow
export const approveEntry = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    entry.approvalStatus = 'APPROVED';
    entry.approvalWorkflow.push({
      level: entry.approvalWorkflow.length + 1,
      approverId: req.user.id,
      status: 'APPROVED',
      date: new Date()
    });

    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Post
export const bulkPost = async (req: Request, res: Response) => {
  try {
    const { entryIds } = req.body;
    
    const entries = await JournalEntry.find({
      _id: { $in: entryIds },
      isPosted: false,
      approvalStatus: 'approved'
    });

    for (const entry of entries) {
      entry.isPosted = true;
      await entry.save();
    }

    res.json({ success: true, count: entries.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Budget Impact Preview
export const getBudgetImpact = async (req: Request, res: Response) => {
  try {
    const { lines } = req.body;
    
    const impacts = [];
    for (const line of lines) {
      if (line.departmentId) {
        const budget = await DepartmentBudget.findOne({
          departmentId: line.departmentId,
          status: 'approved'
        });
        
        if (budget) {
          impacts.push({
            departmentId: line.departmentId,
            amount: line.debit || line.credit,
            budgetId: budget._id,
            remaining: budget.totalBudget - budget.spentBudget,
            percentage: ((budget.spentBudget + (line.debit || line.credit)) / budget.totalBudget) * 100
          });
        }
      }
    }

    res.json({ success: true, data: impacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Smart Account Suggestions
export const getAccountSuggestions = async (req: Request, res: Response) => {
  try {
    const { description } = req.query;
    
    // Find similar entries
    const similarEntries = await JournalEntry.find({
      description: { $regex: description, $options: 'i' },
      isPosted: true
    }).limit(10);

    const accountIds = new Set();
    similarEntries.forEach(entry => {
      entry.lines.forEach(line => accountIds.add(line.accountId.toString()));
    });

    const accounts = await ChartOfAccount.find({ _id: { $in: Array.from(accountIds) } });

    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Attachment
export const addAttachment = async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const { filename, url } = req.body;
    entry.attachments.push(url);
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Copy Entry
export const copyEntry = async (req: Request, res: Response) => {
  try {
    const original = await JournalEntry.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const copy = new JournalEntry({
      ...original.toObject(),
      _id: undefined,
      entryNumber: undefined,
      date: new Date(),
      isPosted: false,
      createdBy: req.user?.id
    });

    await copy.save();

    res.json({ success: true, data: copy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
function calculateNextDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

function evaluateFormula(formula: string, variables: any): number {
  try {
    let result = formula;
    Object.keys(variables).forEach(key => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(variables[key]));
    });
    // Safe evaluation - only allow basic math
    const sanitized = result.replace(/[^0-9+\-*/().\s]/g, '');
    return Function('"use strict"; return (' + sanitized + ')')();
  } catch {
    return 0;
  }
}

