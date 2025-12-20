import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendApprovalRequestEmail = async (
  to: string,
  approverName: string,
  approval: any
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rayerp.com',
    to,
    subject: `Approval Required: ${approval.title}`,
    html: `
      <h2>Approval Request</h2>
      <p>Dear ${approverName},</p>
      <p>A new approval request requires your attention:</p>
      <ul>
        <li><strong>Title:</strong> ${approval.title}</li>
        <li><strong>Amount:</strong> ₹${approval.amount.toLocaleString()}</li>
        <li><strong>Type:</strong> ${approval.entityType}</li>
        <li><strong>Priority:</strong> ${approval.priority}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/finance/approvals">View Approval</a></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Approval email sent to ${to}`);
  } catch (error) {
    logger.error('Email send error:', error);
  }
};

export const sendApprovalApprovedEmail = async (
  to: string,
  requesterName: string,
  approval: any
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rayerp.com',
    to,
    subject: `Approved: ${approval.title}`,
    html: `
      <h2>Approval Approved</h2>
      <p>Dear ${requesterName},</p>
      <p>Your approval request has been approved:</p>
      <ul>
        <li><strong>Title:</strong> ${approval.title}</li>
        <li><strong>Amount:</strong> ₹${approval.amount.toLocaleString()}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error('Email send error:', error);
  }
};

export const sendApprovalRejectedEmail = async (
  to: string,
  requesterName: string,
  approval: any,
  reason: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rayerp.com',
    to,
    subject: `Rejected: ${approval.title}`,
    html: `
      <h2>Approval Rejected</h2>
      <p>Dear ${requesterName},</p>
      <p>Your approval request has been rejected:</p>
      <ul>
        <li><strong>Title:</strong> ${approval.title}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error('Email send error:', error);
  }
};
