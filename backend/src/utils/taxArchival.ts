import TaxRecord from '../models/TaxRecord';
import cron from 'node-cron';

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

        console.log(`Archived ${result.modifiedCount} tax records older than 7 years`);
        return result.modifiedCount;
    } catch (error) {
        console.error('Error archiving tax records:', error);
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

        console.log(`Found ${upcomingTaxes.length} upcoming tax obligations`);
        // TODO: Integrate with notification system
        return upcomingTaxes.length;
    } catch (error) {
        console.error('Error sending tax reminders:', error);
        throw error;
    }
};

/**
 * Initialize tax management cron jobs
 */
export const initializeTaxCronJobs = () => {
    // Archive old records - Run monthly on 1st at 2 AM
    cron.schedule('0 2 1 * *', async () => {
        console.log('Running tax archival job...');
        await archiveOldTaxRecords();
    });

    // Send reminders - Run daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running tax reminder job...');
        await sendTaxReminders();
    });

    console.log('Tax management cron jobs initialized');
};
