import express from 'express';
import JournalEntry from '../models/JournalEntry';
import JournalEntryTemplate from '../models/JournalEntryTemplate';
import ChartOfAccount from '../models/ChartOfAccount';
import { GLBudget } from '../models/GLBudget';
import AllocationRule from '../models/AllocationRule';
import ReferenceBalance from '../models/ReferenceBalance';
import { protect } from '../middleware/auth.middleware';
import { requireFinanceAccess } from '../middleware/financePermission.middleware';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
router.use(protect);

const storage = multer.diskStorage({
  destination: './public/uploads/journal-entries/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Generate entry number
const generateEntryNumber = async (fiscalYear: number) => {
  const count = await JournalEntry.countDocuments({ periodYear: fiscalYear });
  return `JE/${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}/${String(count + 1).padStart(5, '0')}`;
};

// Check period lock
const checkPeriodLock = async (year: number, month: number) => {
  const locked = await JournalEntry.findOne({ periodYear: year, periodMonth: month, isLocked: true });
  return !!locked;
};

// Budget check
const performBudgetCheck = async (lines: any[], year: number) => {
  const warnings = [];
  for (const line of lines) {
    const budget = await GLBudget.findOne({ account: line.account, fiscalYear: year, status: 'APPROVED' });
    if (budget) {
      const entries = await JournalEntry.find({ 'lines.account': line.account, periodYear: year, status: 'POSTED' });
      const actualAmount = entries.reduce((sum, e) => sum + e.lines.filter(l => l.account.toString() === line.account.toString()).reduce((s, l) => s + l.debit - l.credit, 0), 0);
      const newAmount = actualAmount + (line.debit - line.credit);
      
      const totalBudget = budget.budgetAmount || 0;
      if (newAmount > totalBudget) {
        warnings.push({
          account: line.account,
          budgetAmount: totalBudget,
          actualAmount: newAmount,
          variance: newAmount - totalBudget,
          message: `Exceeds budget by ${newAmount - totalBudget}`
        });
      }
    }
  }
  return warnings;
};

// Apply allocation rules
const applyAllocationRules = async (lines: any[]) => {
  const expandedLines = [];
  for (const line of lines) {
    const rule = await AllocationRule.findOne({ sourceAccount: line.account, isActive: true });
    if (rule) {
      for (const target of rule.targets) {
        expandedLines.push({
          ...line,
          account: target.accountId,
          costCenter: target.costCenterId,
          debit: line.debit * (target.percentage / 100),
          credit: line.credit * (target.percentage / 100),
          description: `${line.description} - Allocated ${target.percentage}%`
        });
      }
    } else {
      expandedLines.push(line);
    }
  }
  return expandedLines;
};

// VALIDATE Journal Entry (Real-time)
router.post('/validate', requireFinanceAccess('journal.view'), async (req, res) => {
  try {
    const { lines, date } = req.body;
    const year = new Date(date).getFullYear();
    const budgetWarnings = await performBudgetCheck(lines, year);
    res.json({ success: true, budgetWarnings });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// CREATE Journal Entry
router.post('/', requireFinanceAccess('journal.create'), async (req, res) => {
  try {
    const { entryDate, lines } = req.body;
    const year = new Date(entryDate).getFullYear();
    const month = new Date(entryDate).getMonth() + 1;
    
    if (await checkPeriodLock(year, month)) {
      return res.status(400).json({ success: false, message: 'Period is locked' });
    }
    
    const entryNumber = await generateEntryNumber(year);
    const allocatedLines = await applyAllocationRules(lines);
    const budgetWarnings = await performBudgetCheck(allocatedLines, year);
    
    const entry = new JournalEntry({
      ...req.body,
      entryNumber,
      lines: allocatedLines,
      periodYear: year,
      periodMonth: month,
      budgetCheckPerformed: true,
      budgetWarnings,
      createdBy: req.user?.id
    });
    
    // Track changes
    entry.changeHistory.push({
      changedBy: req.user?.id,
      changedAt: new Date(),
      field: 'created',
      oldValue: null,
      newValue: 'Entry created'
    });
    
    await entry.save();
    res.status(201).json({ success: true, data: entry, budgetWarnings });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET All Journal Entries
router.get('/', requireFinanceAccess('journal.view'), async (req, res) => {
  try {
    const { status, type, fromDate, toDate, year, month } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.entryType = type;
    if (year) filter.periodYear = parseInt(year as string);
    if (month) filter.periodMonth = parseInt(month as string);
    if (fromDate || toDate) filter.entryDate = {};
    if (fromDate) filter.entryDate.$gte = new Date(fromDate as string);
    if (toDate) filter.entryDate.$lte = new Date(toDate as string);
    
    const entries = await JournalEntry.find(filter)
      .populate('lines.account', 'code name type contactInfo')
      .sort({ entryDate: -1 })
      .lean();
    res.json({ success: true, data: entries });
  } catch (error: any) {
    console.error('Journal entries fetch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Journal Entry Stats
router.get('/stats', requireFinanceAccess('journal.view'), async (req, res) => {
  try {
    const stats = {
      total: await JournalEntry.countDocuments(),
      draft: await JournalEntry.countDocuments({ status: 'DRAFT' }),
      posted: await JournalEntry.countDocuments({ status: 'POSTED' }),
      recurring: await JournalEntry.countDocuments({ isRecurring: true }),
      totalDebit: (await JournalEntry.aggregate([{ $match: { status: 'POSTED' } }, { $group: { _id: null, total: { $sum: '$totalDebit' } } }]))[0]?.total || 0,
      totalCredit: (await JournalEntry.aggregate([{ $match: { status: 'POSTED' } }, { $group: { _id: null, total: { $sum: '$totalCredit' } } }]))[0]?.total || 0
    };
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Journal Entry - Approve
router.post('/:id/approve', requireFinanceAccess('journal.approve'), async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    
    const level = entry.approvalWorkflow.find(w => w.approverId.toString() === req.user?.id && w.status === 'PENDING');
    if (!level) return res.status(403).json({ success: false, message: 'Not authorized to approve' });
    
    level.status = 'APPROVED';
    level.date = new Date();
    level.comments = req.body.comments;
    
    if (entry.approvalWorkflow.every(w => w.status === 'APPROVED')) {
      entry.approvalStatus = 'APPROVED';
      entry.status = 'APPROVED';
    }
    
    entry.changeHistory.push({
      changedBy: req.user?.id,
      changedAt: new Date(),
      field: 'approval',
      oldValue: 'PENDING',
      newValue: 'APPROVED'
    });
    
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Journal Entry - Post
router.post('/:id/post', requireFinanceAccess('journal.post'), async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (entry.status === 'POSTED') return res.status(400).json({ success: false, message: 'Entry already posted' });
    
    if (await checkPeriodLock(entry.periodYear, entry.periodMonth)) {
      return res.status(400).json({ success: false, message: 'Period is locked' });
    }
    
    entry.status = 'POSTED';
    entry.postingDate = new Date();
    entry.postedBy = req.user?.id;
    
    entry.changeHistory.push({
      changedBy: req.user?.id,
      changedAt: new Date(),
      field: 'status',
      oldValue: 'DRAFT',
      newValue: 'POSTED'
    });
    
    await entry.save();
    
    // Update account balances
    for (const line of entry.lines) {
      await ChartOfAccount.findByIdAndUpdate(line.account, {
        $inc: { balance: line.debit - line.credit }
      });
    }
    
    // Auto-create references if JE has reference field (Tally-style)
    let referencesCreated = 0;
    if (entry.reference && req.body.createReferences !== false) {
      try {
        for (const line of entry.lines) {
          if (line.debit > 0 || line.credit > 0) {
            const existing = await ReferenceBalance.findOne({ 
              journalEntryId: entry._id, 
              accountId: line.account 
            });
            
            if (!existing) {
              const amount = line.debit > 0 ? line.debit : line.credit;
              const refBalance = new ReferenceBalance({
                journalEntryId: entry._id,
                entryNumber: entry.entryNumber,
                reference: entry.reference,
                date: entry.entryDate,
                description: line.description || entry.description,
                accountId: line.account,
                totalAmount: amount,
                paidAmount: 0,
                outstandingAmount: amount
              });
              
              await refBalance.save();
              referencesCreated++;
            }
          }
        }
      } catch (refError) {
        console.error('Error creating references:', refError);
        // Don't fail the posting if reference creation fails
      }
    }
    
    res.json({ 
      success: true, 
      data: entry, 
      message: 'Entry posted successfully',
      referencesCreated
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Batch Post
router.post('/batch-post', async (req, res) => {
  try {
    const { entryIds } = req.body;
    const posted = [];
    
    for (const id of entryIds) {
      const entry = await JournalEntry.findById(id);
      if (entry && entry.status === 'APPROVED') {
        entry.status = 'POSTED';
        entry.postingDate = new Date();
        entry.postedBy = req.user?.id;
        await entry.save();
        
        for (const line of entry.lines) {
          await ChartOfAccount.findByIdAndUpdate(line.account, {
            $inc: { balance: line.debit - line.credit }
          });
        }
        posted.push(entry);
      }
    }
    
    res.json({ success: true, data: posted, message: `${posted.length} entries posted` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Journal Entry - Reverse
router.post('/:id/reverse', async (req, res) => {
  try {
    const original = await JournalEntry.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (original.status !== 'POSTED') return res.status(400).json({ success: false, message: 'Can only reverse posted entries' });
    
    const reversedLines = original.lines.map(line => ({
      account: line.account,
      debit: line.credit,
      credit: line.debit,
      description: `REVERSAL: ${line.description}`,
      costCenter: line.costCenter,
      department: line.department,
      project: line.project
    }));
    
    const entryNumber = await generateEntryNumber(new Date().getFullYear());
    const reversalEntry = new JournalEntry({
      entryNumber,
      entryType: 'REVERSING',
      status: 'POSTED',
      entryDate: new Date(),
      postingDate: new Date(),
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      description: `REVERSAL: ${original.description}`,
      reference: original.entryNumber,
      lines: reversedLines,
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      originalEntryId: original._id,
      createdBy: req.user?.id,
      postedBy: req.user?.id,
      reversalReason: req.body.reason
    });
    
    await reversalEntry.save();
    
    original.status = 'REVERSED';
    original.reversedEntryId = reversalEntry._id;
    original.reversedBy = req.user?.id;
    await original.save();
    
    // Update account balances
    for (const line of reversedLines) {
      await ChartOfAccount.findByIdAndUpdate(line.account, {
        $inc: { balance: line.debit - line.credit }
      });
    }
    
    res.json({ success: true, data: reversalEntry, message: 'Entry reversed successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Copy Entry
router.post('/:id/copy', async (req, res) => {
  try {
    const original = await JournalEntry.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Entry not found' });
    
    const entryNumber = await generateEntryNumber(new Date().getFullYear());
    const copied = new JournalEntry({
      ...original.toObject(),
      _id: undefined,
      entryNumber,
      status: 'DRAFT',
      entryDate: req.body.entryDate || new Date(),
      postingDate: undefined,
      postedBy: undefined,
      periodYear: new Date(req.body.entryDate || new Date()).getFullYear(),
      periodMonth: new Date(req.body.entryDate || new Date()).getMonth() + 1,
      createdBy: req.user?.id,
      changeHistory: []
    });
    
    await copied.save();
    res.status(201).json({ success: true, data: copied });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Create from Template
router.post('/from-template/:templateId', async (req, res) => {
  try {
    const template = await JournalEntryTemplate.findById(req.params.templateId);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    
    const { variables, entryDate } = req.body;
    const year = new Date(entryDate).getFullYear();
    const entryNumber = await generateEntryNumber(year);
    
    // Replace variables in lines
    const lines = template.lines.map(line => {
      const newLine: any = { ...line };
      if (line.accountVariable && variables[line.accountVariable]) newLine.account = variables[line.accountVariable];
      if (line.debitVariable && variables[line.debitVariable]) newLine.debit = variables[line.debitVariable];
      if (line.creditVariable && variables[line.creditVariable]) newLine.credit = variables[line.creditVariable];
      if (line.debitFormula) newLine.debit = eval(line.debitFormula.replace(/{{(\w+)}}/g, (_, v) => variables[v]));
      if (line.creditFormula) newLine.credit = eval(line.creditFormula.replace(/{{(\w+)}}/g, (_, v) => variables[v]));
      return newLine;
    });
    
    const entry = new JournalEntry({
      entryNumber,
      entryType: 'TEMPLATE',
      status: 'DRAFT',
      entryDate,
      periodYear: year,
      periodMonth: new Date(entryDate).getMonth() + 1,
      description: template.description || template.name,
      lines,
      totalDebit: lines.reduce((sum, l) => sum + (l.debit || 0), 0),
      totalCredit: lines.reduce((sum, l) => sum + (l.credit || 0), 0),
      templateId: template._id,
      templateName: template.name,
      isRecurring: template.isRecurring,
      recurringFrequency: template.recurringFrequency,
      autoPost: template.autoPost,
      createdBy: req.user?.id
    });
    
    await entry.save();
    template.usageCount++;
    await template.save();
    
    res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Generate Recurring Entries
router.post('/generate-recurring', async (req, res) => {
  try {
    const recurringEntries = await JournalEntry.find({ isRecurring: true, nextRecurringDate: { $lte: new Date() }, status: { $in: ['POSTED', 'APPROVED'] } });
    const created = [];
    
    for (const parent of recurringEntries) {
      const entryNumber = await generateEntryNumber(new Date().getFullYear());
      const newEntry = new JournalEntry({
        ...parent.toObject(),
        _id: undefined,
        entryNumber,
        status: parent.autoPost ? 'POSTED' : 'DRAFT',
        entryDate: new Date(),
        postingDate: parent.autoPost ? new Date() : undefined,
        postedBy: parent.autoPost ? parent.createdBy : undefined,
        periodYear: new Date().getFullYear(),
        periodMonth: new Date().getMonth() + 1,
        createdBy: parent.createdBy,
        changeHistory: []
      });
      
      await newEntry.save();
      created.push(newEntry);
      
      if (parent.autoPost) {
        for (const line of newEntry.lines) {
          await ChartOfAccount.findByIdAndUpdate(line.account, {
            $inc: { balance: line.debit - line.credit }
          });
        }
      }
      
      // Update next recurring date
      const nextDate = new Date(parent.nextRecurringDate);
      if (parent.recurringFrequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (parent.recurringFrequency === 'QUARTERLY') nextDate.setMonth(nextDate.getMonth() + 3);
      else if (parent.recurringFrequency === 'SEMI_ANNUALLY') nextDate.setMonth(nextDate.getMonth() + 6);
      else if (parent.recurringFrequency === 'ANNUALLY') nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      parent.nextRecurringDate = nextDate;
      await parent.save();
    }
    
    res.json({ success: true, data: created, message: `${created.length} recurring entries generated` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Bulk Import from CSV
router.post('/bulk-import', upload.single('file'), async (req, res) => {
  try {
    const entries: any[] = [];
    const filePath = req.file?.path;
    
    if (!filePath) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows = fileContent.split('\n').slice(1);
    const created = [];
    
    for (const row of rows) {
      if (!row.trim()) continue;
      const [entryDate, description, linesJson] = row.split(',');
      
      const year = new Date(entryDate).getFullYear();
      const entryNumber = await generateEntryNumber(year);
      
      const lines = JSON.parse(linesJson);
      const je = new JournalEntry({
        entryNumber,
        entryType: 'MANUAL',
        status: 'DRAFT',
        entryDate: new Date(entryDate),
        date: new Date(entryDate),
        periodYear: year,
        periodMonth: new Date(entryDate).getMonth() + 1,
        description,
        lines,
        totalDebit: lines.reduce((sum: number, l: any) => sum + l.debit, 0),
        totalCredit: lines.reduce((sum: number, l: any) => sum + l.credit, 0),
        createdBy: req.user?.id
      });
      
      await je.save();
      created.push(je);
    }
    
    fs.unlinkSync(filePath);
    res.status(201).json({ success: true, data: created, message: `${created.length} entries imported` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Lock Period
router.post('/lock-period', async (req, res) => {
  try {
    const { year, month } = req.body;
    await JournalEntry.updateMany(
      { periodYear: year, periodMonth: month },
      { isLocked: true, lockedBy: req.user?.id, lockedDate: new Date() }
    );
    res.json({ success: true, message: `Period ${year}-${month} locked` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Upload Attachment
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    
    entry.attachments.push(`/uploads/journal-entries/${req.file?.filename}`);
    await entry.save();
    
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET Entry by ID
router.get('/:id', requireFinanceAccess('journal.view'), async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id)
      .populate('lines.account', 'code name type contactInfo')
      .populate('createdBy', 'firstName lastName name email')
      .populate('postedBy', 'firstName lastName name email')
      .lean();
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update Entry
router.put('/:id', requireFinanceAccess('journal.edit'), async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (entry.status !== 'DRAFT') return res.status(400).json({ success: false, message: 'Can only update draft entries' });
    
    // Track changes
    Object.keys(req.body).forEach(key => {
      if (JSON.stringify(entry[key]) !== JSON.stringify(req.body[key])) {
        entry.changeHistory.push({
          changedBy: req.user?.id,
          changedAt: new Date(),
          field: key,
          oldValue: entry[key],
          newValue: req.body[key]
        });
      }
    });
    
    Object.assign(entry, req.body);
    entry.updatedBy = req.user?.id;
    await entry.save();
    
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE Entry
router.delete('/:id', requireFinanceAccess('journal.delete'), async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (entry.status !== 'DRAFT') return res.status(400).json({ success: false, message: 'Can only delete draft entries' });
    
    await entry.deleteOne();
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

