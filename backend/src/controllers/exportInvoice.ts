import { Request, Response } from 'express';
import { Account } from '../models/Account';
import JournalEntry from '../models/JournalEntry';
import { logger } from '../utils/logger';

function generateEnhancedAccountLedgerHTML(account: any, invoiceData: any[], totalDebit: number, totalCredit: number): string {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-IN');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Ledger - ${account.name}</title>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; font-size: 12px; background: #f8f9fa; }
        .ledger-container { max-width: 900px; margin: 0 auto; background: white; border: 3px solid #1e40af; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px; border-bottom: 3px solid #1e40af; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; }
        .company-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .company-tagline { font-size: 14px; margin-bottom: 15px; opacity: 0.9; }
        .document-title { font-size: 22px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 4px; display: inline-block; }
        
        .account-info { display: flex; justify-content: space-between; padding: 20px; border-bottom: 2px solid #e5e7eb; background: #f8fafc; }
        .account-details, .statement-details { width: 48%; }
        .section-title { font-weight: bold; color: #1e40af; margin-bottom: 12px; font-size: 16px; text-decoration: underline; }
        .info-row { display: flex; justify-content: space-between; margin: 6px 0; padding: 4px 0; }
        .info-label { font-weight: 600; color: #374151; }
        .info-value { color: #111827; font-weight: 500; }
        
        .entries-section { padding: 20px; }
        .entries-table { width: 100%; border-collapse: collapse; margin: 15px 0; border: 2px solid #1e40af; }
        .entries-table th { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 12px 8px; text-align: center; font-weight: bold; border: 1px solid #1e40af; }
        .entries-table td { padding: 10px 8px; border: 1px solid #d1d5db; text-align: left; }
        .entries-table tr:nth-child(even) { background: #f9fafb; }
        .entries-table tr:hover { background: #e0f2fe; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .totals-section { background: #f0f9ff; padding: 15px 20px; border-top: 2px solid #1e40af; }
        .total-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 6px 0; font-size: 14px; }
        .total-row.grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #1e40af; padding-top: 10px; color: #1e40af; }
        .total-row.net-amount { font-weight: bold; font-size: 16px; background: #dbeafe; padding: 8px; border-radius: 4px; color: #1e40af; }
        
        .footer { padding: 20px; border-top: 2px solid #e5e7eb; background: #f8fafc; text-align: center; }
        .footer-note { font-size: 11px; color: #6b7280; margin: 5px 0; }
        .footer-company { font-weight: bold; color: #1e40af; margin: 8px 0; }
        
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(30, 64, 175, 0.05); font-weight: bold; z-index: -1; pointer-events: none; }
        
        @media print {
            body { margin: 0; background: white; }
            .ledger-container { border: none; box-shadow: none; }
            .watermark { display: none; }
        }
    </style>
</head>
<body>
    <div class="watermark">RayERP</div>
    
    <div class="ledger-container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">RayERP</div>
            <div class="company-tagline">Enterprise Resource Planning System</div>
            <div class="document-title">ACCOUNT LEDGER STATEMENT</div>
        </div>

        <!-- Account Information -->
        <div class="account-info">
            <div class="account-details">
                <div class="section-title">Account Information</div>
                <div class="info-row">
                    <span class="info-label">Account Code:</span>
                    <span class="info-value">${account.code}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Account Name:</span>
                    <span class="info-value">${account.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Account Type:</span>
                    <span class="info-value">${account.type?.toUpperCase() || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Currency:</span>
                    <span class="info-value">${account.currency || 'INR'}</span>
                </div>
            </div>
            
            <div class="statement-details">
                <div class="section-title">Statement Details</div>
                <div class="info-row">
                    <span class="info-label">Generated Date:</span>
                    <span class="info-value">${formatDate(new Date())}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Entries:</span>
                    <span class="info-value">${invoiceData.length}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Period From:</span>
                    <span class="info-value">${invoiceData.length > 0 ? formatDate(new Date(invoiceData[0].date)) : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Period To:</span>
                    <span class="info-value">${invoiceData.length > 0 ? formatDate(new Date(invoiceData[invoiceData.length-1].date)) : 'N/A'}</span>
                </div>
            </div>
        </div>

        <!-- Entries Table -->
        <div class="entries-section">
            <table class="entries-table">
                <thead>
                    <tr>
                        <th style="width: 8%;">Sr. No.</th>
                        <th style="width: 12%;">Date</th>
                        <th style="width: 15%;">Entry No.</th>
                        <th style="width: 30%;">Description</th>
                        <th style="width: 15%;">Reference</th>
                        <th style="width: 10%;">Debit (₹)</th>
                        <th style="width: 10%;">Credit (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.map((item, index) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td class="text-center">${formatDate(new Date(item.date))}</td>
                            <td class="text-center">${item.entryNumber}</td>
                            <td>${item.description}</td>
                            <td class="text-center">${item.reference || '-'}</td>
                            <td class="text-right">${formatCurrency(item.debit)}</td>
                            <td class="text-right">${formatCurrency(item.credit)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals-section">
            <div class="total-row">
                <span>Total Debit:</span>
                <span>${formatCurrency(totalDebit)}</span>
            </div>
            <div class="total-row">
                <span>Total Credit:</span>
                <span>${formatCurrency(totalCredit)}</span>
            </div>
            <div class="total-row net-amount">
                <span>Net Amount (Debit - Credit):</span>
                <span>${formatCurrency(totalDebit - totalCredit)}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-company">RayERP - Enterprise Resource Planning System</div>
            <div class="footer-note">This is a computer-generated document and does not require physical signature.</div>
            <div class="footer-note">Generated on ${formatDate(new Date())} at ${new Date().toLocaleTimeString('en-IN')}</div>
            <div class="footer-note">© ${new Date().getFullYear()} RayERP. All Rights Reserved.</div>
        </div>
    </div>
</body>
</html>`;
}

export const exportInvoice = async (req: Request, res: Response) => {
  try {
    const { entryIds, format, accountId } = req.body;
    
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Entry IDs required' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const entries = await JournalEntry.find({ _id: { $in: entryIds } }).sort({ entryDate: 1 });
    if (entries.length === 0) {
      return res.status(404).json({ success: false, message: 'No entries found' });
    }

    let totalDebit = 0, totalCredit = 0;
    const invoiceData: any[] = [];
    
    for (const entry of entries) {
      const line = entry.lines.find((l: any) => l.account?.toString() === accountId);
      if (line) {
        invoiceData.push({
          date: entry.entryDate || entry.date,
          entryNumber: entry.entryNumber,
          description: line.description || entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit
        });
        totalDebit += line.debit;
        totalCredit += line.credit;
      }
    }

    // Generate enhanced Tally-style HTML with QR code
    const html = generateEnhancedAccountLedgerHTML(account, invoiceData, totalDebit, totalCredit);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${account.code}-${Date.now()}.html`);
    res.send(html);
  } catch (error) {
    logger.error('Error exporting invoice:', error);
    res.status(500).json({ success: false, message: 'Error exporting invoice' });
  }
};
