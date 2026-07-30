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

  async sendAccountPendingApproval(to: string, applicantName: string, applicantEmail: string) {
    const result = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `New account awaiting approval - ${process.env.COMPANY_NAME || 'RayERP'}`,
      html: this.getNoticeTemplate(
        'New account awaiting approval',
        `<p><strong>${applicantName}</strong> (${applicantEmail}) has registered and is waiting for approval.</p>
         <p>Review the request in the Users section of ${process.env.COMPANY_NAME || 'RayERP'} to assign a role or reject the account.</p>`
      )
    });
    return { success: true, messageId: result.messageId };
  }

  async sendAccountApproved(to: string, name: string, roleName: string) {
    const loginUrl = `${process.env.FRONTEND_URL || ''}/login`;
    const result = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Your account has been approved - ${process.env.COMPANY_NAME || 'RayERP'}`,
      html: this.getNoticeTemplate(
        'Your account is ready',
        `<p>Hello ${name},</p>
         <p>Your account has been approved and assigned the <strong>${roleName}</strong> role. You can now sign in.</p>
         <p><a href="${loginUrl}">${loginUrl}</a></p>`
      )
    });
    return { success: true, messageId: result.messageId };
  }

  async sendAccountRejected(to: string, name: string, reason?: string) {
    const result = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Update on your account request - ${process.env.COMPANY_NAME || 'RayERP'}`,
      html: this.getNoticeTemplate(
        'Account request not approved',
        `<p>Hello ${name},</p>
         <p>Your account request was not approved.</p>
         ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
         <p>Contact your administrator if you believe this is a mistake.</p>`
      )
    });
    return { success: true, messageId: result.messageId };
  }

  private getNoticeTemplate(heading: string, body: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${heading}</h2>
        ${body}
        <p style="margin-top: 24px;">Regards,<br>${process.env.COMPANY_NAME || 'RayERP Team'}</p>
      </div>
    `;
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