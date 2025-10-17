import { Request, Response } from 'express';
import { JournalEntry } from '../models/JournalEntry';
import { ChartOfAccounts } from '../models/ChartOfAccounts';
import { CostCenter } from '../models/CostCenter';
import { Ledger } from '../models/Ledger';

export const journalEntryController = {
  // Get all journal entries
  async getAll(req: Request, res: Response) {
    try {
      const { 
        status, 
        projectId, 
        sourceModule, 
        fromDate, 
        toDate, 
        page = 1, 
        limit = 50 
      } = req.query;
      
      const filter: any = {};
      if (status) filter.status = status;
      if (projectId) filter.projectId = projectId;
      if (sourceModule) filter.sourceModule = sourceModule;
      
      if (fromDate || toDate) {
        filter.date = {};
        if (fromDate) filter.date.$gte = new Date(fromDate as string);
        if (toDate) filter.date.$lte = new Date(toDate as string);
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const journalEntries = await JournalEntry.find(filter)
        .populate('lines.accountId', 'code name type')
        .populate('lines.costCenterId', 'code name')
        .populate('lines.projectId', 'name')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ date: -1, entryNumber: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await JournalEntry.countDocuments(filter);
      
      res.json({
        journalEntries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
  },

  // Create new journal entry
  async create(req: Request, res: Response) {
    try {
      const journalData = req.body;
      
      // Generate entry number
      const count = await JournalEntry.countDocuments();
      journalData.entryNumber = `JE${String(count + 1).padStart(6, '0')}`;
      
      // Set fiscal year (should be determined by date)
      journalData.fiscalYear = '2024-25'; // This should be dynamic based on date
      
      const journalEntry = new JournalEntry(journalData);
      await journalEntry.save();
      
      await journalEntry.populate('lines.accountId', 'code name type');
      res.status(201).json(journalEntry);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create journal entry' });
    }
  },

  // Update journal entry (only if not posted)
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const existingEntry = await JournalEntry.findById(id);
      if (!existingEntry) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      if (existingEntry.isPosted) {
        return res.status(400).json({ error: 'Cannot update posted journal entry' });
      }
      
      const journalEntry = await JournalEntry.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true, runValidators: true }
      ).populate('lines.accountId', 'code name type');
      
      res.json(journalEntry);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update journal entry' });
    }
  },

  // Post journal entry (create ledger entries)
  async post(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const journalEntry = await JournalEntry.findById(id)
        .populate('lines.accountId', 'code name type balance');
      
      if (!journalEntry) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      if (journalEntry.isPosted) {
        return res.status(400).json({ error: 'Journal entry already posted' });
      }
      
      if (journalEntry.status !== 'approved') {
        return res.status(400).json({ error: 'Journal entry must be approved before posting' });
      }

      // Create ledger entries and update account balances
      for (const line of journalEntry.lines) {
        // Create ledger entry
        const ledgerEntry = new Ledger({
          accountId: line.accountId,
          date: journalEntry.date,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          balance: 0, // Will be calculated
          journalEntryId: journalEntry._id,
          reference: journalEntry.reference
        });

        // Update account balance
        const account = await ChartOfAccounts.findById(line.accountId);
        if (account) {
          if (['asset', 'expense'].includes(account.type)) {
            account.balance += (line.debit - line.credit);
          } else {
            account.balance += (line.credit - line.debit);
          }
          ledgerEntry.balance = account.balance;
          await account.save();
        }

        await ledgerEntry.save();

        // Update cost center actual costs if applicable
        if (line.costCenterId && line.debit > 0) {
          await CostCenter.findByIdAndUpdate(
            line.costCenterId,
            { $inc: { actualCost: line.debit } }
          );
        }
      }

      // Mark journal entry as posted
      journalEntry.isPosted = true;
      journalEntry.status = 'posted';
      await journalEntry.save();
      
      res.json({ message: 'Journal entry posted successfully', journalEntry });
    } catch (error) {
      res.status(500).json({ error: 'Failed to post journal entry' });
    }
  },

  // Approve journal entry
  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      
      const journalEntry = await JournalEntry.findByIdAndUpdate(
        id,
        {
          status: 'approved',
          approvedBy,
          approvedAt: new Date()
        },
        { new: true }
      ).populate('lines.accountId', 'code name type');
      
      if (!journalEntry) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      res.json(journalEntry);
    } catch (error) {
      res.status(400).json({ error: 'Failed to approve journal entry' });
    }
  },

  // Get journal entry by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const journalEntry = await JournalEntry.findById(id)
        .populate('lines.accountId', 'code name type')
        .populate('lines.costCenterId', 'code name')
        .populate('lines.projectId', 'name')
        .populate('lines.boqItemId', 'itemCode description')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email');
      
      if (!journalEntry) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      res.json(journalEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch journal entry' });
    }
  },

  // Delete journal entry (only if not posted)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const journalEntry = await JournalEntry.findById(id);
      if (!journalEntry) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      if (journalEntry.isPosted) {
        return res.status(400).json({ error: 'Cannot delete posted journal entry' });
      }
      
      await JournalEntry.findByIdAndDelete(id);
      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete journal entry' });
    }
  },

  // Get project-wise journal entries
  async getByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { fromDate, toDate } = req.query;
      
      const filter: any = { projectId };
      if (fromDate || toDate) {
        filter.date = {};
        if (fromDate) filter.date.$gte = new Date(fromDate as string);
        if (toDate) filter.date.$lte = new Date(toDate as string);
      }
      
      const journalEntries = await JournalEntry.find(filter)
        .populate('lines.accountId', 'code name type')
        .populate('lines.costCenterId', 'code name')
        .sort({ date: -1 });
      
      // Calculate project cost summary
      let totalCost = 0;
      const costByCategory = {
        material: 0,
        labour: 0,
        equipment: 0,
        subcontractor: 0,
        overhead: 0
      };
      
      journalEntries.forEach(entry => {
        if (entry.isPosted) {
          entry.lines.forEach(line => {
            if (line.debit > 0 && line.costHead) {
              totalCost += line.debit;
              costByCategory[line.costHead] += line.debit;
            }
          });
        }
      });
      
      res.json({
        journalEntries,
        summary: {
          totalCost,
          costByCategory,
          entryCount: journalEntries.length,
          postedCount: journalEntries.filter(je => je.isPosted).length
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project journal entries' });
    }
  }
};