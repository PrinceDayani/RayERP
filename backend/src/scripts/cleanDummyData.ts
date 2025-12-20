import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../models/Contact';
import ChartOfAccount from '../models/ChartOfAccount';
import Notification from '../models/Notification';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

async function cleanDummyData() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');

    // Delete all auto-created customer/vendor accounts
    const deletedAccounts = await ChartOfAccount.deleteMany({
      $or: [
        { code: { $regex: /^CUST-/ } },
        { code: { $regex: /^VEND-/ } },
        { code: 'AR-GROUP' },
        { code: 'AP-GROUP' }
      ]
    });
    logger.info(`Deleted ${deletedAccounts.deletedCount} auto-created accounts`);

    // Clear ledgerAccountId from all contacts
    const updatedContacts = await Contact.updateMany(
      { ledgerAccountId: { $exists: true } },
      { $unset: { ledgerAccountId: '' } }
    );
    logger.info(`Cleared ledgerAccountId from ${updatedContacts.modifiedCount} contacts`);

    // Delete all notifications related to account creation
    const deletedNotifications = await Notification.deleteMany({
      $or: [
        { title: 'Customer Account Created' },
        { title: 'Vendor Account Created' },
        { title: 'Contact Updated' }
      ]
    });
    logger.info(`Deleted ${deletedNotifications.deletedCount} notifications`);

    logger.info('✅ Dummy data cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error cleaning dummy data:', error);
    process.exit(1);
  }
}

cleanDummyData();
