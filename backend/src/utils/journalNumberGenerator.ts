import JournalEntry from '../models/JournalEntry';

/**
 * Journal Entry Number Format: TYPE-SOURCE-YYYYMMDD-HHMMSS-XXX
 * - TYPE: Entry type (MAN=Manual, REC=Recurring, REV=Reversing, INV=Invoice, VOU=Voucher, etc.)
 * - SOURCE: Source module (GL=General Ledger, AP=Accounts Payable, AR=Accounts Receivable, etc.)
 * - YYYYMMDD: Date (20240115)
 * - HHMMSS: Time (143025)
 * - XXX: Sequential number (001-999)
 * 
 * Examples:
 * - MAN-GL-20240115-143025-001
 * - INV-AR-20240115-143026-001
 * - VOU-AP-20240115-143027-001
 */

type EntryType = 'MANUAL' | 'RECURRING' | 'REVERSING' | 'INVOICE' | 'VOUCHER' | 'PAYROLL' | 'DEPRECIATION' | 'ACCRUAL';
type SourceModule = 'GL' | 'AR' | 'AP' | 'INV' | 'PAY' | 'FA' | 'TAX';

const TYPE_MAP: Record<EntryType, string> = {
  MANUAL: 'MAN',
  RECURRING: 'REC',
  REVERSING: 'REV',
  INVOICE: 'INV',
  VOUCHER: 'VOU',
  PAYROLL: 'PAY',
  DEPRECIATION: 'DEP',
  ACCRUAL: 'ACC'
};

export const generateJournalEntryNumber = async (
  type: EntryType = 'MANUAL',
  source: SourceModule = 'GL'
): Promise<string> => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const typeCode = TYPE_MAP[type] || 'MAN';
  const prefix = `${typeCode}-${source}-${dateStr}-${timeStr}`;

  const lastEntry = await JournalEntry.findOne({
    entryNumber: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` }
  })
    .sort({ entryNumber: -1 })
    .select('entryNumber')
    .lean();

  let sequence = 1;
  if (lastEntry?.entryNumber) {
    const parts = lastEntry.entryNumber.split('-');
    sequence = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

type InvoiceType = 'SALES' | 'PURCHASE';

/**
 * Invoice Number Format: TYPE-YYYYMMDD-HHMMSS-XXX
 * - TYPE: INV (Sales) or PINV (Purchase)
 * - YYYYMMDD: Date (20240115)
 * - HHMMSS: Time (143025)
 * - XXX: Sequential number (001-999)
 */

export const generateInvoiceNumber = async (type: InvoiceType = 'SALES'): Promise<string> => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const typeCode = type === 'SALES' ? 'INV' : 'PINV';
  const prefix = `${typeCode}-${dateStr}-${timeStr}`;

  const Invoice = (await import('../models/Invoice')).default;
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}` }
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  let sequence = 1;
  if (lastInvoice?.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split('-');
    sequence = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};
