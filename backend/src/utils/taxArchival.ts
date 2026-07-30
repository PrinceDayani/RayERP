import TaxRecord from '../models/TaxRecord';
import cron from 'node-cron';
import { logger } from './logger';

/**
 * Archive tax records older than 7 years (regulatory requirement)
 */
export const archiveOldTaxRecords = async () => {
    try {
        const sevenYearsAgo = new Date();
        sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

        const result = await TaxRecord.updateMany(
            {
                createdAt: { $lt: sevenYearsAgo },
                isDeleted: false
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: null // System archival
                }
            }
        );

        return result.modifiedCount;
    } catch (error: any) {
        logger.error('Error archiving tax records', { message: error?.message });
        throw error;
    }
};

/**
 * Send reminders for upcoming tax due dates
 */
export const sendTaxReminders = async () => {
    try {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const upcomingTaxes = await TaxRecord.find({
            dueDate: { $lte: threeDaysFromNow, $gte: new Date() },
            status: { $in: ['Pending', 'Overdue'] },
            isDeleted: false
        }).populate('createdBy', 'email name');

        // TODO: Integrate with notification system
        return upcomingTaxes.length;
    } catch (error: any) {
        logger.error('Error sending tax reminders', { message: error?.message });
        throw error;
    }
};

/**
 * Initialize tax management cron jobs
 */
export const initializeTaxCronJobs = () => {
    // Archive old records - Run monthly on 1st at 2 AM
    cron.schedule('0 2 1 * *', async () => {
        await archiveOldTaxRecords();
    });

    // Send reminders - Run daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
        await sendTaxReminders();
    });
};
