import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendInvoice(invoice: any, pdfBuffer?: Buffer) {
    try {
      const attachments = [];
      if (pdfBuffer) {
        attachments.push({
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: invoice.partyEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${process.env.COMPANY_NAME || 'RayERP'}`,
        html: this.getInvoiceEmailTemplate(invoice),
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Invoice email sent', { invoiceId: invoice._id, messageId: result.messageId });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send invoice email', { error: error instanceof Error ? error.message : 'Unknown error', invoiceId: invoice._id });
      throw error;
    }
  }

  private getInvoiceEmailTemplate(invoice: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.partyName},</p>
        <p>Please find attached your invoice for the amount of <strong>₹${invoice.totalAmount.toLocaleString()}</strong>.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Amount:</strong> ₹${invoice.totalAmount.toLocaleString()}</p>
        </div>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME || 'RayERP Team'}</p>
      </div>
    `;
  }
}

export default new EmailService();