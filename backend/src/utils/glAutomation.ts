import { JournalEntry } from '../models/JournalEntry';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { Ledger } from '../models/Ledger';
import mongoose from 'mongoose';

interface AutoJournalEntry {
  transactionType: 'invoice' | 'bill' | 'payment' | 'receipt' | 'adjustment';
  transactionId: string;
  amount: number;
  description: string;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  metadata?: Record<string, any>;
}

export class GLAutomation {
  // Auto-create journal entry for invoice
  static async createInvoiceJournal(invoiceData: {
    invoiceId: string;
    customerId: string;
    amount: number;
    taxAmount?: number;
    items: Array<{ description: string; amount: number; }>;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { invoiceId, amount, taxAmount = 0 } = invoiceData;

      // Find required accounts
      const accountsReceivable = await Account.findOne({ code: '1100' }).session(session);
      const salesRevenue = await Account.findOne({ code: '4000' }).session(session);
      const salesTax = taxAmount > 0 ? await Account.findOne({ code: '2300' }).session(session) : null;

      if (!accountsReceivable || !salesRevenue) {
        throw new Error('Required accounts not found');
      }

      const lines = [
        {
          accountId: accountsReceivable._id,
          debit: amount,
          credit: 0,
          description: `Invoice ${invoiceId} - Customer receivable`
        },
        {
          accountId: salesRevenue._id,
          debit: 0,
          credit: amount - taxAmount,
          description: `Invoice ${invoiceId} - Sales revenue`
        }
      ];

      if (taxAmount > 0 && salesTax) {
        lines.push({
          accountId: salesTax._id,
          debit: 0,
          credit: taxAmount,
          description: `Invoice ${invoiceId} - Sales tax`
        });
      }

      const journalEntry = await this.createJournalEntry({
        transactionType: 'invoice',
        transactionId: invoiceId,
        amount,
        description: `Auto-generated from Invoice ${invoiceId}`,
        lines,
        metadata: invoiceData
      }, session);

      await session.commitTransaction();
      return journalEntry;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Auto-create journal entry for payment
  static async createPaymentJournal(paymentData: {
    paymentId: string;
    amount: number;
    fromAccountCode: string;
    toAccountCode: string;
    paymentType: 'customer_payment' | 'supplier_payment' | 'expense_payment';
    reference?: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { paymentId, amount, fromAccountCode, toAccountCode, reference } = paymentData;

      const fromAccount = await Account.findOne({ code: fromAccountCode }).session(session);
      const toAccount = await Account.findOne({ code: toAccountCode }).session(session);

      if (!fromAccount || !toAccount) {
        throw new Error('Payment accounts not found');
      }

      const lines = [
        {
          accountId: toAccount._id,
          debit: amount,
          credit: 0,
          description: `Payment ${paymentId} - ${reference || 'Payment received'}`
        },
        {
          accountId: fromAccount._id,
          debit: 0,
          credit: amount,
          description: `Payment ${paymentId} - ${reference || 'Payment made'}`
        }
      ];

      const journalEntry = await this.createJournalEntry({
        transactionType: 'payment',
        transactionId: paymentId,
        amount,
        description: `Auto-generated from Payment ${paymentId}`,
        lines,
        metadata: paymentData
      }, session);

      await session.commitTransaction();
      return journalEntry;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Generic journal entry creation
  private static async createJournalEntry(
    data: AutoJournalEntry,
    session: mongoose.ClientSession
  ) {
    // Generate entry number
    const lastEntry = await JournalEntry.findOne().sort({ entryNumber: -1 }).session(session);
    const nextNumber = lastEntry 
      ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 
      : 1;
    const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

    // Create journal entry
    const journalEntry = await JournalEntry.create([{
      entryNumber,
      date: new Date(),
      reference: data.transactionId,
      description: data.description,
      lines: data.lines,
      createdBy: new mongoose.Types.ObjectId()
    }], { session });

    // Create transaction link
    await Transaction.create([{
      transactionType: data.transactionType,
      transactionId: data.transactionId,
      journalEntryId: journalEntry[0]._id,
      amount: data.amount,
      status: 'posted',
      metadata: data.metadata
    }], { session });

    // Auto-post the journal entry
    await this.postJournalEntry(journalEntry[0]._id, session);

    return journalEntry[0];
  }

  // Post journal entry and update ledgers
  private static async postJournalEntry(
    journalEntryId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) {
    const journalEntry = await JournalEntry.findById(journalEntryId).session(session);
    if (!journalEntry || journalEntry.isPosted) return;

    // Process each journal line
    for (const line of journalEntry.lines) {
      const account = await Account.findById(line.accountId).session(session);
      if (!account) continue;

      // Calculate new balance
      let newBalance = account.balance;
      if (['asset', 'expense'].includes(account.type)) {
        newBalance += line.debit - line.credit;
      } else {
        newBalance += line.credit - line.debit;
      }

      // Update account balance
      await Account.findByIdAndUpdate(
        line.accountId,
        { balance: newBalance },
        { session }
      );

      // Create ledger entry
      await Ledger.create([{
        accountId: line.accountId,
        date: journalEntry.date,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
        balance: newBalance,
        journalEntryId: journalEntry._id,
        reference: journalEntry.reference
      }], { session });
    }

    // Mark as posted
    journalEntry.isPosted = true;
    await journalEntry.save({ session });
  }
}