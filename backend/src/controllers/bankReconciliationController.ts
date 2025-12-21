import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';
import { logger } from '../utils/logger';

interface IBankStatement extends mongoose.Document {
  accountId: mongoose.Types.ObjectId;
  statementDate: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: {
    date: Date;
    description: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  uploadedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'reconciled' | 'partial';
}

const BankStatementSchema = new mongoose.Schema<IBankStatement>({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  statementDate: { type: Date, required: true },
  openingBalance: { type: Number, required: true },
  closingBalance: { type: Number, required: true },
  transactions: [{
    date: Date,
    description: String,
    reference: String,
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: Number
  }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'reconciled', 'partial'], default: 'pending' }
}, { timestamps: true });

const BankStatement = mongoose.model<IBankStatement>('BankStatement', BankStatementSchema);

interface IReconciliation extends mongoose.Document {
  accountId: mongoose.Types.ObjectId;
  statementId: mongoose.Types.ObjectId;
  reconciliationDate: Date;
  bookBalance: number;
  bankBalance: number;
  matchedTransactions: mongoose.Types.ObjectId[];
  unmatchedBookEntries: mongoose.Types.ObjectId[];
  unmatchedBankEntries: string[];
  adjustments: {
    description: string;
    amount: number;
    type: 'add' | 'subtract';
  }[];
  reconciledBy: mongoose.Types.ObjectId;
  status: 'in_progress' | 'completed';
}

const ReconciliationSchema = new mongoose.Schema<IReconciliation>({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  statementId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatement', required: true },
  reconciliationDate: { type: Date, default: Date.now },
  bookBalance: { type: Number, required: true },
  bankBalance: { type: Number, required: true },
  matchedTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' }],
  unmatchedBookEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' }],
  unmatchedBankEntries: [String],
  adjustments: [{
    description: String,
    amount: Number,
    type: { type: String, enum: ['add', 'subtract'] }
  }],
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' }
}, { timestamps: true });

const Reconciliation = mongoose.model<IReconciliation>('Reconciliation', ReconciliationSchema);

export const uploadBankStatement = async (req: Request, res: Response) => {
  try {
    const { accountId, statementDate, openingBalance, closingBalance, transactions } = req.body;
    const userId = (req as any).user?.id;

    const account = await ChartOfAccount.findById(accountId);
    if (!account || account.type.toLowerCase() !== 'asset') {
      return res.status(400).json({ message: 'Invalid bank account' });
    }

    const statement = await BankStatement.create({
      accountId,
      statementDate: new Date(statementDate),
      openingBalance,
      closingBalance,
      transactions,
      uploadedBy: userId
    });

    res.status(201).json({ success: true, data: statement });
  } catch (error) {
    logger.error('Upload bank statement error:', error);
    res.status(500).json({ message: 'Error uploading bank statement' });
  }
};

export const startReconciliation = async (req: Request, res: Response) => {
  try {
    const { statementId } = req.params;
    const userId = (req as any).user?.id;

    const statement = await BankStatement.findById(statementId);
    if (!statement) {
      return res.status(404).json({ message: 'Bank statement not found' });
    }

    const account = await ChartOfAccount.findById(statement.accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const ledgerEntries = await Ledger.find({
      accountId: statement.accountId,
      date: { $lte: statement.statementDate }
    }).sort({ date: 1 });

    const bookBalance = account.balance;
    const bankBalance = statement.closingBalance;

    const matchedTransactions: mongoose.Types.ObjectId[] = [];
    const unmatchedBookEntries: mongoose.Types.ObjectId[] = [];
    const unmatchedBankEntries: string[] = [];

    // Auto-matching algorithm with fuzzy matching
    for (const bankTxn of statement.transactions) {
      const match = ledgerEntries.find(entry => {
        const amountMatch = Math.abs(entry.debit - bankTxn.debit) < 0.01 && Math.abs(entry.credit - bankTxn.credit) < 0.01;
        const dateMatch = Math.abs(entry.date.getTime() - new Date(bankTxn.date).getTime()) < 3 * 24 * 60 * 60 * 1000; // 3 days tolerance
        const descMatch = entry.description?.toLowerCase().includes(bankTxn.description?.toLowerCase().substring(0, 10) || '');
        return amountMatch && (dateMatch || descMatch);
      });

      if (match) {
        matchedTransactions.push(match._id);
      } else {
        unmatchedBankEntries.push(bankTxn.reference);
      }
    }

    for (const entry of ledgerEntries) {
      if (!matchedTransactions.includes(entry._id)) {
        unmatchedBookEntries.push(entry._id);
      }
    }

    const reconciliation = await Reconciliation.create({
      accountId: statement.accountId,
      statementId,
      bookBalance,
      bankBalance,
      matchedTransactions,
      unmatchedBookEntries,
      unmatchedBankEntries,
      reconciledBy: userId
    });

    res.json({ success: true, data: reconciliation });
  } catch (error) {
    logger.error('Start reconciliation error:', error);
    res.status(500).json({ message: 'Error starting reconciliation' });
  }
};

export const bulkMatch = async (req: Request, res: Response) => {
  try {
    const { reconciliationId, matches } = req.body;
    const reconciliation = await Reconciliation.findById(reconciliationId);
    if (!reconciliation) {
      return res.status(404).json({ message: 'Reconciliation not found' });
    }
    
    for (const match of matches) {
      if (!reconciliation.matchedTransactions.includes(match.ledgerId)) {
        reconciliation.matchedTransactions.push(match.ledgerId);
        reconciliation.unmatchedBookEntries = reconciliation.unmatchedBookEntries.filter(id => !id.equals(match.ledgerId));
      }
    }
    
    await reconciliation.save();
    res.json({ success: true, data: reconciliation });
  } catch (error) {
    logger.error('Bulk match error:', error);
    res.status(500).json({ message: 'Error performing bulk match' });
  }
};

export const getOutstandingItems = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const reconciliations = await Reconciliation.find({ accountId, status: 'completed' }).sort({ reconciliationDate: -1 }).limit(1);
    
    if (reconciliations.length === 0) {
      return res.json({ success: true, data: { outstandingCheques: [], depositsInTransit: [] } });
    }
    
    const lastRecon = reconciliations[0];
    const outstandingCheques = await Ledger.find({ _id: { $in: lastRecon.unmatchedBookEntries }, debit: { $gt: 0 } });
    const depositsInTransit = await Ledger.find({ _id: { $in: lastRecon.unmatchedBookEntries }, credit: { $gt: 0 } });
    
    res.json({ success: true, data: { outstandingCheques, depositsInTransit } });
  } catch (error) {
    logger.error('Outstanding items error:', error);
    res.status(500).json({ message: 'Error fetching outstanding items' });
  }
}

export const completeReconciliation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustments } = req.body;

    const reconciliation = await Reconciliation.findById(id);
    if (!reconciliation) {
      return res.status(404).json({ message: 'Reconciliation not found' });
    }

    reconciliation.adjustments = adjustments || [];
    reconciliation.status = 'completed';
    await reconciliation.save();

    await BankStatement.findByIdAndUpdate(
      reconciliation.statementId,
      { status: 'reconciled' }
    );

    res.json({ success: true, message: 'Reconciliation completed', data: reconciliation });
  } catch (error) {
    logger.error('Complete reconciliation error:', error);
    res.status(500).json({ message: 'Error completing reconciliation' });
  }
};

export const getReconciliations = async (req: Request, res: Response) => {
  try {
    const { accountId, status } = req.query;
    const query: any = {};
    if (accountId) query.accountId = accountId;
    if (status) query.status = status;

    const reconciliations = await Reconciliation.find(query)
      .populate('accountId', 'code name')
      .populate('statementId')
      .populate('reconciledBy', 'name email')
      .sort({ reconciliationDate: -1 });

    res.json({ success: true, data: reconciliations });
  } catch (error) {
    logger.error('Get reconciliations error:', error);
    res.status(500).json({ message: 'Error fetching reconciliations' });
  }
};

export const getBankStatements = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    const query: any = {};
    if (accountId) query.accountId = accountId;

    const statements = await BankStatement.find(query)
      .populate('accountId', 'code name')
      .populate('uploadedBy', 'name email')
      .sort({ statementDate: -1 });

    res.json({ success: true, data: statements });
  } catch (error) {
    logger.error('Get bank statements error:', error);
    res.status(500).json({ message: 'Error fetching bank statements' });
  }
};

