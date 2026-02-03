import express from 'express';
import { protect as auth } from '../middleware/auth.middleware';
import { Payment } from '../models/Finance';
import ReferenceBalance from '../models/ReferenceBalance';
import JournalEntry from '../models/JournalEntry';
import ChartOfAccount from '../models/ChartOfAccount';
import mongoose from 'mongoose';

const router = express.Router();

// Get outstanding references
router.get('/outstanding-references', auth, async (req, res) => {
  try {
    const { accountId, status } = req.query;
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['OUTSTANDING', 'PARTIALLY_PAID'] };
    }
    
    if (accountId) filter.accountId = accountId;
    
    const references = await ReferenceBalance.find(filter)
      .populate('journalEntryId', 'entryNumber reference description date status')
      .populate('accountId', 'code name type')
      .sort({ date: -1 })
      .limit(100)
      .lean();
    
    res.json({ success: true, references, count: references.length });
  } catch (error: any) {
    console.error('Error fetching references:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get reference details
router.get('/reference/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid reference ID' });
    }

    const reference = await ReferenceBalance.findById(req.params.id)
      .populate('journalEntryId')
      .populate('accountId', 'code name type')
      .populate('payments.paymentId', 'paymentNumber paymentDate paymentMethod')
      .lean();
    
    if (!reference) {
      return res.status(404).json({ success: false, message: 'Reference not found' });
    }
    
    res.json({ success: true, reference });
  } catch (error: any) {
    console.error('Error fetching reference:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create payment against reference
router.post('/pay-reference', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { paymentId, referenceId, amount } = req.body;
    
    if (!paymentId || !referenceId || !amount) {
      throw new Error('Missing required fields: paymentId, referenceId, amount');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) throw new Error('Payment not found');
    
    const reference = await ReferenceBalance.findById(referenceId).session(session);
    if (!reference) throw new Error('Reference not found');
    
    if (amount > payment.unappliedAmount) {
      throw new Error(`Amount ${amount} exceeds unapplied balance ${payment.unappliedAmount}`);
    }
    
    if (amount > reference.outstandingAmount) {
      throw new Error(`Amount ${amount} exceeds outstanding reference amount ${reference.outstandingAmount}`);
    }
    
    // Add reference allocation to payment
    if (!payment.referenceAllocations) {
      payment.referenceAllocations = [];
    }
    payment.referenceAllocations.push({
      journalEntryId: reference.journalEntryId,
      entryNumber: reference.entryNumber,
      reference: reference.reference,
      amount,
      allocationDate: new Date(),
      description: reference.description
    });
    payment.allocatedAmount = (payment.allocatedAmount || 0) + amount;
    payment.unappliedAmount = payment.totalAmount - payment.allocatedAmount;
    await payment.save({ session });
    
    reference.paidAmount += amount;
    reference.payments.push({
      paymentId: payment._id,
      paymentNumber: payment.paymentNumber,
      amount,
      date: new Date()
    });
    await reference.save({ session });
    
    await session.commitTransaction();
    res.json({ success: true, payment, reference, message: 'Payment allocated successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error paying reference:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// Create reference balance from JE
router.post('/create-reference', auth, async (req, res) => {
  try {
    const { journalEntryId, accountId, amount, reference: refNumber, description: refDesc } = req.body;
    
    if (!accountId || !amount) {
      throw new Error('Missing required fields: accountId, amount');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    const account = await ChartOfAccount.findById(accountId);
    if (!account) throw new Error('Account not found');
    
    let refData: any = {
      accountId,
      totalAmount: amount,
      paidAmount: 0,
      outstandingAmount: amount,
      date: new Date()
    };
    
    if (journalEntryId) {
      const je = await JournalEntry.findById(journalEntryId);
      if (!je) throw new Error('Journal Entry not found');
      
      if (!je.reference) throw new Error('Journal Entry must have a reference field');
      
      if (je.status !== 'POSTED') throw new Error('Journal Entry must be posted');
      
      const existing = await ReferenceBalance.findOne({ journalEntryId, accountId });
      if (existing) throw new Error('Reference already exists for this account');
      
      refData = {
        ...refData,
        journalEntryId: je._id,
        entryNumber: je.entryNumber,
        reference: je.reference,
        date: je.entryDate,
        description: je.description
      };
    } else {
      // Manual reference without JE
      if (!refNumber) throw new Error('Reference number is required for manual references');
      
      const counter = await ReferenceBalance.countDocuments({ journalEntryId: null });
      refData.description = refDesc || `Manual reference for ${account.name}`;
      refData.reference = refNumber;
      refData.entryNumber = `MAN-${String(counter + 1).padStart(5, '0')}`;
    }
    
    const refBalance = new ReferenceBalance(refData);
    
    await refBalance.save();
    res.json({ success: true, reference: refBalance, message: 'Reference created successfully' });
  } catch (error: any) {
    console.error('Error creating reference:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Auto-create references from JE on posting (Tally-style)
router.post('/auto-create-from-je/:jeId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jeId)) {
      return res.status(400).json({ success: false, message: 'Invalid journal entry ID' });
    }

    const je = await JournalEntry.findById(req.params.jeId).populate('lines.account');
    if (!je) throw new Error('Journal Entry not found');
    
    if (je.status !== 'POSTED') throw new Error('Journal Entry must be posted');
    
    const created = [];
    
    for (const line of je.lines) {
      if (line.debit > 0 || line.credit > 0) {
        // Handle different reference types
        if (line.refType === 'new-ref' && line.refId) {
          // Create new reference
          const existing = await ReferenceBalance.findOne({ 
            journalEntryId: je._id, 
            accountId: line.account 
          });
          
          if (!existing) {
            const amount = line.debit > 0 ? line.debit : line.credit;
            const refBalance = new ReferenceBalance({
              journalEntryId: je._id,
              entryNumber: je.entryNumber,
              reference: line.refId,
              date: je.entryDate,
              description: line.description || je.description,
              accountId: line.account,
              totalAmount: amount,
              paidAmount: 0,
              outstandingAmount: amount
            });
            
            await refBalance.save();
            created.push(refBalance);
          }
        } else if (line.refType === 'agst-ref' && line.refId) {
          // Allocate against existing reference
          const reference = await ReferenceBalance.findById(line.refId);
          if (reference) {
            const amount = line.debit > 0 ? line.debit : line.credit;
            if (amount <= reference.outstandingAmount) {
              reference.paidAmount += amount;
              reference.payments.push({
                paymentId: je._id,
                paymentNumber: je.entryNumber,
                amount,
                date: new Date()
              });
              await reference.save();
            }
          }
        } else if (je.reference && line.refType === 'on-account') {
          // Default: create reference if JE has reference field
          const existing = await ReferenceBalance.findOne({ 
            journalEntryId: je._id, 
            accountId: line.account 
          });
          
          if (!existing) {
            const amount = line.debit > 0 ? line.debit : line.credit;
            const refBalance = new ReferenceBalance({
              journalEntryId: je._id,
              entryNumber: je.entryNumber,
              reference: je.reference,
              date: je.entryDate,
              description: line.description || je.description,
              accountId: line.account,
              totalAmount: amount,
              paidAmount: 0,
              outstandingAmount: amount
            });
            
            await refBalance.save();
            created.push(refBalance);
          }
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Processed ${created.length} reference(s)`, 
      references: created,
      created: created.length
    });
  } catch (error: any) {
    console.error('Error auto-creating references:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get payment allocations for a reference
router.get('/reference/:id/payments', auth, async (req, res) => {
  try {
    const reference = await ReferenceBalance.findById(req.params.id);
    if (!reference) {
      return res.status(404).json({ success: false, message: 'Reference not found' });
    }
    
    const payments = await Payment.find({
      'referenceAllocations.journalEntryId': reference.journalEntryId
    }).populate('createdBy', 'name email');
    
    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update reference
router.put('/reference/:id', auth, async (req, res) => {
  try {
    const { totalAmount, description } = req.body;
    const reference = await ReferenceBalance.findById(req.params.id);
    
    if (!reference) {
      return res.status(404).json({ success: false, message: 'Reference not found' });
    }
    
    if (totalAmount !== undefined) {
      if (totalAmount < reference.paidAmount) {
        return res.status(400).json({ 
          success: false, 
          message: `Total amount (${totalAmount}) cannot be less than paid amount (${reference.paidAmount})` 
        });
      }
      reference.totalAmount = totalAmount;
    }
    
    if (description) reference.description = description;
    
    await reference.save();
    res.json({ success: true, reference, message: 'Reference updated successfully' });
  } catch (error: any) {
    console.error('Error updating reference:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete reference
router.delete('/reference/:id', auth, async (req, res) => {
  try {
    const reference = await ReferenceBalance.findById(req.params.id);
    
    if (!reference) {
      return res.status(404).json({ success: false, message: 'Reference not found' });
    }
    
    if (reference.paidAmount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete reference with payments (${reference.paidAmount} paid). Remove payments first.` 
      });
    }
    
    await ReferenceBalance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reference deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting reference:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove payment allocation from reference
router.delete('/reference/:refId/payment/:paymentId', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { refId, paymentId } = req.params;
    
    const reference = await ReferenceBalance.findById(refId).session(session);
    if (!reference) throw new Error('Reference not found');
    
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) throw new Error('Payment not found');
    
    const allocationIndex = reference.payments.findIndex(
      (p: any) => p.paymentId.toString() === paymentId
    );
    
    if (allocationIndex === -1) {
      throw new Error('Payment allocation not found');
    }
    
    const allocatedAmount = reference.payments[allocationIndex].amount;
    
    reference.payments.splice(allocationIndex, 1);
    reference.paidAmount -= allocatedAmount;
    await reference.save({ session });
    
    const paymentAllocIndex = payment.referenceAllocations.findIndex(
      (a: any) => a.journalEntryId.toString() === reference.journalEntryId.toString()
    );
    
    if (paymentAllocIndex !== -1) {
      payment.referenceAllocations.splice(paymentAllocIndex, 1);
      await payment.save({ session });
    }
    
    await session.commitTransaction();
    res.json({ success: true, reference, payment, message: 'Payment allocation removed successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error removing payment allocation:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
