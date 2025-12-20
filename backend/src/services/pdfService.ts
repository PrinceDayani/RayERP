import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';

class PDFService {
  async generateInvoicePDF(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('INVOICE', 50, 50);
        doc.fontSize(12).text(`${process.env.COMPANY_NAME || 'RayERP'}`, 50, 80);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 400, 50);
        doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 400, 70);
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 90);

        // Bill To
        doc.text('Bill To:', 50, 130);
        doc.text(invoice.partyName, 50, 150);
        if (invoice.partyEmail) doc.text(invoice.partyEmail, 50, 170);
        if (invoice.partyAddress) doc.text(invoice.partyAddress, 50, 190);

        // Line Items Table
        let yPosition = 250;
        doc.text('Description', 50, yPosition);
        doc.text('Qty', 300, yPosition);
        doc.text('Rate', 350, yPosition);
        doc.text('Amount', 450, yPosition);
        
        doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
        yPosition += 30;

        invoice.lineItems.forEach((item: any) => {
          doc.text(item.description, 50, yPosition);
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(`₹${item.unitPrice.toLocaleString()}`, 350, yPosition);
          doc.text(`₹${item.amount.toLocaleString()}`, 450, yPosition);
          yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc.text(`Subtotal: ₹${invoice.subtotal.toLocaleString()}`, 350, yPosition);
        yPosition += 20;
        doc.text(`Tax: ₹${invoice.totalTax.toLocaleString()}`, 350, yPosition);
        yPosition += 20;
        doc.fontSize(14).text(`Total: ₹${invoice.totalAmount.toLocaleString()}`, 350, yPosition);

        // Footer
        doc.fontSize(10).text('Thank you for your business!', 50, doc.page.height - 100);

        doc.end();
        logger.info('PDF generated for invoice', { invoiceId: invoice._id });
      } catch (error) {
        logger.error('PDF generation failed', { error: error instanceof Error ? error.message : 'Unknown error', invoiceId: invoice._id });
        reject(error);
      }
    });
  }
}

export default new PDFService();