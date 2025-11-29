import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import QRCode from 'qrcode';

export const createTallyInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      partyName,
      partyEmail,
      partyAddress,
      partyGSTIN,
      workOrderNumber,
      gstEnabled,
      gstRate,
      invoiceDate,
      dueDate,
      lineItems,
      notes
    } = req.body;

    // Calculate amounts
    let subtotal = 0;
    const processedLineItems = lineItems.map((item: any) => {
      const amount = (item.quantity * item.unitPrice) - (item.discount || 0);
      subtotal += amount;
      
      let taxAmount = 0;
      if (gstEnabled && gstRate) {
        taxAmount = (amount * gstRate) / 100;
      }
      
      return {
        ...item,
        amount,
        taxAmount,
        taxRate: gstEnabled ? gstRate : 0
      };
    });

    // Calculate GST amounts
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let gstTotalAmount = 0;

    if (gstEnabled && gstRate) {
      const gstAmount = (subtotal * gstRate) / 100;
      
      // For simplicity, split GST equally between CGST and SGST (intra-state)
      // In real implementation, check if inter-state or intra-state
      if (partyGSTIN && partyGSTIN.substring(0, 2) !== '27') { // Assuming company is in Maharashtra (27)
        igstAmount = gstAmount; // Inter-state
      } else {
        cgstAmount = gstAmount / 2; // Intra-state
        sgstAmount = gstAmount / 2;
      }
      
      gstTotalAmount = cgstAmount + sgstAmount + igstAmount;
    }

    const totalAmount = subtotal + gstTotalAmount;

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    const invoiceData = {
      invoiceNumber,
      workOrderNumber,
      invoiceType: 'SALES',
      partyName,
      partyEmail,
      partyAddress,
      partyGSTIN,
      gstEnabled,
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstTotalAmount,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      lineItems: processedLineItems,
      subtotal,
      totalTax: gstTotalAmount,
      totalAmount,
      amountInBaseCurrency: totalAmount,
      balanceAmount: totalAmount,
      notes,
      createdBy: req.user.id
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Tally invoice created successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTallyInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ invoiceType: 'SALES' })
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTallyInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateTallyInvoicePDF = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Generate QR Code
    const qrData = JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      workOrderNumber: invoice.workOrderNumber,
      amount: invoice.totalAmount,
      date: invoice.invoiceDate,
      gst: invoice.gstEnabled ? invoice.gstTotalAmount : 0,
      party: invoice.partyName
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    // Generate Tally-style HTML
    const html = generateTallyInvoiceHTML(invoice, qrCodeDataUrl);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=tally-invoice-${invoice.invoiceNumber}.html`);
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function generateTallyInvoiceHTML(invoice: any, qrCodeDataUrl: string): string {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-IN');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
        .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #000; }
        .header { text-align: center; padding: 15px; border-bottom: 2px solid #000; background: #f5f5f5; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 11px; margin-bottom: 10px; }
        .invoice-title { font-size: 18px; font-weight: bold; text-decoration: underline; }
        
        .invoice-info { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #000; }
        .invoice-details, .party-details { width: 48%; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; }
        
        .line-items { border-bottom: 1px solid #000; }
        .line-items table { width: 100%; border-collapse: collapse; }
        .line-items th, .line-items td { border: 1px solid #000; padding: 8px; text-align: left; }
        .line-items th { background: #f0f0f0; font-weight: bold; text-align: center; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .totals { padding: 15px; }
        .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total-row.grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; }
        
        .footer { display: flex; justify-content: space-between; padding: 15px; border-top: 1px solid #000; }
        .qr-section { text-align: center; }
        .qr-code { max-width: 120px; }
        .terms { width: 60%; font-size: 10px; }
        
        .gst-section { margin-top: 10px; }
        .gst-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .gst-table th, .gst-table td { border: 1px solid #000; padding: 5px; text-align: right; }
        .gst-table th { background: #f0f0f0; }
        
        @media print {
            body { margin: 0; }
            .invoice-container { border: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">RayERP - Enterprise Resource Planning</div>
            <div class="company-details">
                Complete Financial Management System<br>
                GST Compliant Invoice System
            </div>
            <div class="invoice-title">TAX INVOICE</div>
        </div>

        <!-- Invoice Information -->
        <div class="invoice-info">
            <div class="invoice-details">
                <div class="section-title">Invoice Details</div>
                <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
                ${invoice.workOrderNumber ? `<div><strong>Work Order No:</strong> ${invoice.workOrderNumber}</div>` : ''}
                <div><strong>Invoice Date:</strong> ${formatDate(invoice.invoiceDate)}</div>
                <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
                <div><strong>Status:</strong> ${invoice.status}</div>
            </div>
            
            <div class="party-details">
                <div class="section-title">Bill To</div>
                <div><strong>${invoice.partyName}</strong></div>
                ${invoice.partyAddress ? `<div>${invoice.partyAddress}</div>` : ''}
                ${invoice.partyGSTIN ? `<div><strong>GSTIN:</strong> ${invoice.partyGSTIN}</div>` : ''}
                ${invoice.partyEmail ? `<div><strong>Email:</strong> ${invoice.partyEmail}</div>` : ''}
            </div>
        </div>

        <!-- Line Items -->
        <div class="line-items">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">Sr.</th>
                        <th style="width: 40%;">Description of Goods/Services</th>
                        <th style="width: 8%;">Qty</th>
                        <th style="width: 12%;">Rate</th>
                        <th style="width: 10%;">Discount</th>
                        <th style="width: 12%;">Amount</th>
                        ${invoice.gstEnabled ? '<th style="width: 8%;">GST%</th><th style="width: 12%;">Tax Amount</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${invoice.lineItems.map((item: any, index: number) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td>${item.description}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                            <td class="text-right">${formatCurrency(item.discount || 0)}</td>
                            <td class="text-right">${formatCurrency(item.amount)}</td>
                            ${invoice.gstEnabled ? `
                                <td class="text-center">${item.taxRate}%</td>
                                <td class="text-right">${formatCurrency(item.taxAmount || 0)}</td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            
            ${invoice.gstEnabled ? `
                <div class="gst-section">
                    <div style="font-weight: bold; margin-bottom: 5px;">GST Breakdown:</div>
                    <table class="gst-table">
                        <thead>
                            <tr>
                                <th>Tax Type</th>
                                <th>Rate</th>
                                <th>Taxable Amount</th>
                                <th>Tax Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.cgstAmount > 0 ? `
                                <tr>
                                    <td>CGST</td>
                                    <td>${(invoice.gstRate / 2)}%</td>
                                    <td>${formatCurrency(invoice.subtotal)}</td>
                                    <td>${formatCurrency(invoice.cgstAmount)}</td>
                                </tr>
                                <tr>
                                    <td>SGST</td>
                                    <td>${(invoice.gstRate / 2)}%</td>
                                    <td>${formatCurrency(invoice.subtotal)}</td>
                                    <td>${formatCurrency(invoice.sgstAmount)}</td>
                                </tr>
                            ` : ''}
                            ${invoice.igstAmount > 0 ? `
                                <tr>
                                    <td>IGST</td>
                                    <td>${invoice.gstRate}%</td>
                                    <td>${formatCurrency(invoice.subtotal)}</td>
                                    <td>${formatCurrency(invoice.igstAmount)}</td>
                                </tr>
                            ` : ''}
                            <tr style="font-weight: bold;">
                                <td colspan="3">Total GST</td>
                                <td>${formatCurrency(invoice.gstTotalAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>${formatCurrency(invoice.totalAmount)}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="terms">
                <div style="font-weight: bold; margin-bottom: 5px;">Terms & Conditions:</div>
                <div>1. Payment is due within the specified due date.</div>
                <div>2. Interest @ 18% p.a. will be charged on overdue amounts.</div>
                <div>3. All disputes subject to local jurisdiction only.</div>
                ${invoice.notes ? `<div style="margin-top: 8px;"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
                
                <div style="margin-top: 15px; font-size: 9px;">
                    <strong>This is a computer-generated invoice and does not require physical signature.</strong><br>
                    Generated by RayERP - Enterprise Resource Planning System
                </div>
            </div>
            
            <div class="qr-section">
                <div style="font-weight: bold; margin-bottom: 5px;">Invoice QR Code</div>
                <img src="${qrCodeDataUrl}" alt="Invoice QR Code" class="qr-code">
                <div style="font-size: 9px; margin-top: 5px;">
                    Scan for invoice verification
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

export default {
  createTallyInvoice,
  getTallyInvoices,
  getTallyInvoiceById,
  generateTallyInvoicePDF
};