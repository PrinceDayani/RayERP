import { Request, Response } from 'express';
import ChartOfAccount from '../models/ChartOfAccount';
import JournalEntry from '../models/JournalEntry';
import { logger } from '../utils/logger';

export const exportInvoice = async (req: Request, res: Response) => {
  try {
    const { entryIds, format, accountId, from, to } = req.body;
    
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Entry IDs required' });
    }

    const account = await ChartOfAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const entries = await JournalEntry.find({ _id: { $in: entryIds } }).populate('lines.account', 'code name').sort({ entryDate: 1 });
    if (entries.length === 0) {
      return res.status(404).json({ success: false, message: 'No entries found' });
    }

    let totalDebit = 0, totalCredit = 0;
    const invoiceData: any[] = [];
    
    for (const entry of entries) {
      const line = entry.lines.find((l: any) => l.account?._id?.toString() === accountId || l.account?.toString() === accountId);
      if (line) {
        const otherAccount = entry.lines.find((l: any) => {
          const lineAccId = l.account?._id?.toString() || l.account?.toString();
          return lineAccId !== accountId;
        });
        
        const isDebit = line.debit > 0;
        const accountName = otherAccount?.account?.name || '-';
        const fromTo = isDebit ? `Fr: ${accountName}` : `To: ${accountName}`;
        
        invoiceData.push({
          date: entry.entryDate || entry.date,
          entryNumber: entry.entryNumber,
          fromTo,
          description: line.description || entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit
        });
        totalDebit += line.debit;
        totalCredit += line.credit;
      }
    }

    const filterInfo = (from || to) ? `<div class="info-item"><span class="info-label">Filters Applied:</span> <span class="info-value">${from ? 'From: ' + from : ''}${from && to ? ' | ' : ''}${to ? 'To: ' + to : ''}</span></div>` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:40px}.header{text-align:center;margin-bottom:30px;border-bottom:3px solid #2563eb;padding-bottom:20px}.header h1{margin:0;color:#1e40af;font-size:32px}.company{text-align:center;margin-bottom:20px;color:#64748b}.section{margin:30px 0;padding:20px;background:#f8fafc;border-radius:8px}.section-title{font-weight:bold;color:#1e40af;margin-bottom:10px;font-size:18px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.info-item{padding:8px 0}.info-label{font-weight:600;color:#475569}.info-value{color:#0f172a}table{width:100%;border-collapse:collapse;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1)}th{background:#1e40af;color:white;padding:14px;text-align:left;font-weight:600}td{padding:12px;border-bottom:1px solid #e2e8f0}.total{font-weight:bold;background:#dbeafe;font-size:16px}.text-right{text-align:right}.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px}</style></head><body><div class="company"><h2 style="margin:0;color:#1e40af">RayERP - Enterprise Resource Planning</h2><p style="margin:5px 0">Complete Financial Management System</p></div><div class="header"><h1>ACCOUNT LEDGER STATEMENT</h1><p style="color:#64748b;margin:10px 0">Invoice #INV-${Date.now()}</p></div><div class="section"><div class="section-title">Account Information</div><div class="info-grid"><div class="info-item"><span class="info-label">Account Code:</span> <span class="info-value">${account.code}</span></div><div class="info-item"><span class="info-label">Account Name:</span> <span class="info-value">${account.name}</span></div><div class="info-item"><span class="info-label">Account Type:</span> <span class="info-value">${account.type.toUpperCase()}</span></div><div class="info-item"><span class="info-label">Currency:</span> <span class="info-value">${account.currency || 'INR'}</span></div>${filterInfo}</div></div><div class="section"><div class="section-title">Statement Details</div><div class="info-grid"><div class="info-item"><span class="info-label">Generated Date:</span> <span class="info-value">${new Date().toLocaleString()}</span></div><div class="info-item"><span class="info-label">Total Entries:</span> <span class="info-value">${invoiceData.length}</span></div><div class="info-item"><span class="info-label">Period From:</span> <span class="info-value">${invoiceData.length > 0 ? new Date(invoiceData[0].date).toLocaleDateString() : 'N/A'}</span></div><div class="info-item"><span class="info-label">Period To:</span> <span class="info-value">${invoiceData.length > 0 ? new Date(invoiceData[invoiceData.length-1].date).toLocaleDateString() : 'N/A'}</span></div></div></div><table><thead><tr><th>Date</th><th>Entry #</th><th>Fr/To</th><th>Description</th><th>Reference</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead><tbody>${invoiceData.map(item => `<tr><td>${new Date(item.date).toLocaleDateString()}</td><td>${item.entryNumber}</td><td>${item.fromTo}</td><td>${item.description}</td><td>${item.reference || '-'}</td><td class="text-right">${item.debit.toFixed(2)}</td><td class="text-right">${item.credit.toFixed(2)}</td></tr>`).join('')}<tr class="total"><td colspan="5">TOTAL</td><td class="text-right">${totalDebit.toFixed(2)}</td><td class="text-right">${totalCredit.toFixed(2)}</td></tr><tr class="total"><td colspan="5">NET AMOUNT</td><td colspan="2" class="text-right">${(totalDebit - totalCredit).toFixed(2)}</td></tr></tbody></table><div class="footer"><p><strong>This is a computer-generated document. No signature required.</strong></p><p>Generated by RayERP - Enterprise Resource Planning System</p><p>© ${new Date().getFullYear()} All Rights Reserved</p></div></body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${account.code}-${Date.now()}.html`);
    res.send(html);
  } catch (error) {
    logger.error('Error exporting invoice:', error);
    res.status(500).json({ success: false, message: 'Error exporting invoice' });
  }
};

