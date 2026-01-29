import { Request, Response } from 'express';
import ReportSchedule from '../models/ReportSchedule';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const calculateNextRun = (frequency: string): Date => {
  const now = new Date();
  switch (frequency) {
    case 'daily': return new Date(now.setDate(now.getDate() + 1));
    case 'weekly': return new Date(now.setDate(now.getDate() + 7));
    case 'monthly': return new Date(now.setMonth(now.getMonth() + 1));
    case 'quarterly': return new Date(now.setMonth(now.getMonth() + 3));
    default: return new Date(now.setDate(now.getDate() + 1));
  }
};

export const scheduleReport = async (req: Request, res: Response) => {
  try {
    const { reportType, frequency, email, parameters } = req.body;
    const userId = (req as any).user?.id;

    const schedule = await ReportSchedule.create({
      reportType,
      frequency,
      email,
      parameters,
      nextRun: calculateNextRun(frequency),
      createdBy: userId
    });

    res.json({ success: true, data: schedule });
  } catch (error: any) {
    logger.error('Schedule report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { module } = req.query;
    const filter: any = { createdBy: userId, isActive: true };
    if (module) filter.reportType = { $regex: module, $options: 'i' };
    const schedules = await ReportSchedule.find(filter);
    res.json({ success: true, data: schedules });
  } catch (error: any) {
    logger.error('Get schedules error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const schedule = await ReportSchedule.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { $set: req.body },
      { new: true }
    );
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    logger.error('Update schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ReportSchedule.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runScheduledReports = async () => {
  try {
    const now = new Date();
    const dueSchedules = await ReportSchedule.find({ isActive: true, nextRun: { $lte: now } });

    for (const schedule of dueSchedules) {
      try {
        let reportData;
        if (schedule.reportType === 'balance-sheet') {
          reportData = await generateBalanceSheetEmail(schedule.parameters);
        }

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: schedule.email,
          subject: `Scheduled ${schedule.reportType} Report`,
          html: reportData
        });

        await ReportSchedule.findByIdAndUpdate(schedule._id, {
          lastRun: now,
          nextRun: calculateNextRun(schedule.frequency)
        });

        logger.info(`Sent scheduled report to ${schedule.email}`);
      } catch (error) {
        logger.error(`Failed to send report to ${schedule.email}:`, error);
      }
    }
  } catch (error) {
    logger.error('Run scheduled reports error:', error);
  }
};

const generateBalanceSheetEmail = async (params: any): Promise<string> => {
  return `<h2>Balance Sheet Report</h2><p>Report generated on ${new Date().toLocaleDateString()}</p>`;
};
