import cron from 'node-cron';
import { Invoice } from '../models/Finance';
import JournalEntry from '../models/JournalEntry';
import AllocationRule from '../models/AllocationRule';

// Generate Recurring Invoices - Daily at 1 AM
export const scheduleRecurringInvoices = () => {
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('🔄 Running recurring invoice generation...');
      
      const today = new Date();
      const recurringInvoices = await Invoice.find({
        isRecurring: true,
        nextInvoiceDate: { $lte: today },
        $or: [{ recurringEndDate: { $gte: today } }, { recurringEndDate: null }]
      });

      let generated = 0;
      for (const parent of recurringInvoices) {
        const newInvoice = new Invoice({
          ...parent.toObject(),
          _id: undefined,
          invoiceNumber: undefined,
          parentInvoiceId: parent._id,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paidAmount: 0,
          payments: [],
          status: 'draft',
          createdAt: new Date()
        });
        
        await newInvoice.save();
        
        const nextDate = calculateNextDate(parent.nextRecurringDate!, parent.recurringFrequency!);
        parent.nextRecurringDate = nextDate;
        await parent.save();
        
        generated++;
      }

      console.log(`✅ Generated ${generated} recurring invoices`);
    } catch (error) {
      console.error('❌ Error generating recurring invoices:', error);
    }
  });
};

// Generate Recurring Journal Entries - Daily at 2 AM
export const scheduleRecurringJournalEntries = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🔄 Running recurring journal entry generation...');
      
      const today = new Date();
      const recurringEntries = await JournalEntry.find({
        isRecurring: true,
        nextEntryDate: { $lte: today },
        $or: [{ recurringEndDate: { $gte: today } }, { recurringEndDate: null }]
      });

      let generated = 0;
      for (const parent of recurringEntries) {
        const newEntry = new JournalEntry({
          ...parent.toObject(),
          _id: undefined,
          entryNumber: undefined,
          parentEntryId: parent._id,
          date: new Date(),
          isPosted: false,
          approvalStatus: 'pending',
          createdAt: new Date()
        });
        
        await newEntry.save();
        
        const nextDate = calculateNextDate(parent.nextRecurringDate!, parent.recurringFrequency!);
        parent.nextRecurringDate = nextDate;
        await parent.save();
        
        generated++;
      }

      console.log(`✅ Generated ${generated} recurring journal entries`);
    } catch (error) {
      console.error('❌ Error generating recurring journal entries:', error);
    }
  });
};

// Process Reversing Entries - Daily at 3 AM
export const scheduleReversingEntries = () => {
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('🔄 Processing reversing entries...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reversingEntries = await JournalEntry.find({
        isReversing: true,
        reverseDate: { $lte: today },
        isReversed: false
      });

      let reversed = 0;
      for (const entry of reversingEntries) {
        const reversedLines = entry.lines.map(line => ({
          ...line,
          debit: line.credit,
          credit: line.debit,
          description: `Auto-reversal: ${line.description}`
        }));

        const reversingEntry = new JournalEntry({
          entryNumber: `REV-${entry.entryNumber}`,
          entryType: 'REVERSING',
          entryDate: new Date(),
          date: new Date(),
          periodYear: new Date().getFullYear(),
          periodMonth: new Date().getMonth() + 1,
          description: `Auto-reversal of ${entry.entryNumber}`,
          lines: reversedLines,
          totalDebit: entry.totalDebit,
          totalCredit: entry.totalCredit,
          reversedEntryId: entry._id,
          createdBy: entry.createdBy
        });

        await reversingEntry.save();
        
        entry.reversedBy = entry.createdBy;
        entry.reversalReason = 'Auto-reversal';
        await entry.save();
        
        reversed++;
      }

      console.log(`✅ Processed ${reversed} reversing entries`);
    } catch (error) {
      console.error('❌ Error processing reversing entries:', error);
    }
  });
};

// Apply Late Fees - Daily at 4 AM
export const scheduleLateFees = () => {
  cron.schedule('0 4 * * *', async () => {
    try {
      console.log('🔄 Applying late fees...');
      
      const overdueInvoices = await Invoice.find({
        status: 'overdue',
        lateFeePercentage: { $gt: 0 },
        dueDate: { $lt: new Date() }
      });

      let applied = 0;
      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          const lateFee = (invoice.totalAmount * invoice.lateFeePercentage / 100) * daysOverdue;
          
          if (invoice.lateFeeAmount !== lateFee) {
            invoice.lateFeeAmount = lateFee;
            await invoice.save();
            applied++;
          }
        }
      }

      console.log(`✅ Applied late fees to ${applied} invoices`);
    } catch (error) {
      console.error('❌ Error applying late fees:', error);
    }
  });
};

// Send Invoice Reminders - Daily at 9 AM
export const scheduleInvoiceReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('🔄 Sending invoice reminders...');
      
      const today = new Date();
      const reminderDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days before due
      
      const invoices = await Invoice.find({
        status: { $in: ['sent', 'partial'] },
        dueDate: { $lte: reminderDate, $gte: today },
        $or: [
          { lastReminderDate: null },
          { lastReminderDate: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } // Last reminder > 3 days ago
        ]
      });

      let sent = 0;
      for (const invoice of invoices) {
        // TODO: Implement actual email sending
        invoice.remindersSent += 1;
        invoice.lastReminderDate = new Date();
        await invoice.save();
        sent++;
      }

      console.log(`✅ Sent ${sent} invoice reminders`);
    } catch (error) {
      console.error('❌ Error sending reminders:', error);
    }
  });
};

// Run Scheduled Allocation Rules - Daily at 5 AM
export const scheduleAllocationRules = () => {
  cron.schedule('0 5 * * *', async () => {
    try {
      console.log('🔄 Running scheduled allocation rules...');
      
      const today = new Date();
      const rules = await AllocationRule.find({
        isActive: true,
        frequency: { $ne: 'manual' },
        $or: [
          { nextRunDate: { $lte: today } },
          { nextRunDate: null }
        ]
      });

      let executed = 0;
      for (const rule of rules) {
        // Check if should run based on frequency
        const shouldRun = checkFrequency(rule.lastRunDate, rule.frequency);
        
        if (shouldRun) {
          // TODO: Execute allocation rule
          rule.lastRunDate = new Date();
          rule.nextRunDate = calculateNextRunDate(rule.frequency);
          await rule.save();
          executed++;
        }
      }

      console.log(`✅ Executed ${executed} allocation rules`);
    } catch (error) {
      console.error('❌ Error running allocation rules:', error);
    }
  });
};

// Initialize all schedulers
export const initializeSchedulers = () => {
  console.log('🚀 Initializing recurring job schedulers...');
  
  scheduleRecurringInvoices();
  scheduleRecurringJournalEntries();
  scheduleReversingEntries();
  scheduleLateFees();
  scheduleInvoiceReminders();
  scheduleAllocationRules();
  
  console.log('✅ All schedulers initialized');
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

function calculateNextRunDate(frequency: string): Date {
  return calculateNextDate(new Date(), frequency);
}

function checkFrequency(lastRun: Date | undefined, frequency: string): boolean {
  if (!lastRun) return true;
  
  const now = Date.now();
  const lastRunTime = lastRun.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  
  switch (frequency) {
    case 'daily': return now - lastRunTime >= dayMs;
    case 'weekly': return now - lastRunTime >= 7 * dayMs;
    case 'monthly': return now - lastRunTime >= 30 * dayMs;
    case 'quarterly': return now - lastRunTime >= 90 * dayMs;
    default: return false;
  }
}
