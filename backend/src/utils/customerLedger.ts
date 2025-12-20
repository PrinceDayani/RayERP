import ChartOfAccount from '../models/ChartOfAccount';
import Contact from '../models/Contact';
import { logger } from './logger';
import mongoose from 'mongoose';

export const createCustomerLedgerAccount = async (contactId: string, contactName: string, userId: string, isVendor: boolean = false) => {
  try {
    // Check if contact already has a ledger account
    const contact = await Contact.findById(contactId);
    if (contact?.ledgerAccountId) {
      logger.info('Contact already has ledger account', { contactId, accountId: contact.ledgerAccountId });
      return contact.ledgerAccountId;
    }

    const accountType = isVendor ? 'LIABILITY' : 'ASSET';
    const groupCode = isVendor ? 'AP-GROUP' : 'AR-GROUP';
    const groupName = isVendor ? 'Accounts Payable' : 'Accounts Receivable';
    const subType = isVendor ? 'Current Liabilities' : 'Current Assets';
    const category = isVendor ? 'Payables' : 'Receivables';
    const accountPrefix = isVendor ? 'VEND' : 'CUST';
    const accountSuffix = isVendor ? 'Vendor Account' : 'Customer Account';

    // Find or create parent group
    let parentAccount = await ChartOfAccount.findOne({ 
      code: groupCode,
      type: accountType,
      isGroup: true 
    });

    if (!parentAccount) {
      parentAccount = await ChartOfAccount.create({
        code: groupCode,
        name: groupName,
        type: accountType,
        subType,
        category,
        level: 1,
        isActive: true,
        isGroup: true,
        allowPosting: false,
        createdBy: userId
      });
      logger.info(`Created ${groupName} parent group`, { accountId: parentAccount._id });
    }

    // Create ledger account
    const ledgerAccount = new ChartOfAccount({
      code: `${accountPrefix}-${contactId.slice(-6).toUpperCase()}`,
      name: `${contactName} - ${accountSuffix}`,
      type: accountType,
      subType: isVendor ? 'Accounts Payable' : 'Accounts Receivable',
      category: isVendor ? 'Vendor Payables' : 'Customer Receivables',
      level: 2,
      parentId: parentAccount._id,
      isActive: true,
      isGroup: false,
      allowPosting: true,
      contactId: new mongoose.Types.ObjectId(contactId),
      description: `Auto-created ${isVendor ? 'vendor' : 'customer'} account for ${contactName}`,
      createdBy: userId
    });

    await ledgerAccount.save();

    // Update contact with ledger account ID
    await Contact.findByIdAndUpdate(contactId, { 
      ledgerAccountId: ledgerAccount._id 
    });

    logger.info(`${isVendor ? 'Vendor' : 'Customer'} ledger account created successfully`, { 
      contactId, 
      accountId: ledgerAccount._id, 
      accountCode: ledgerAccount.code,
      accountName: ledgerAccount.name,
      accountType
    });

    // Emit real-time event for Chart of Accounts refresh
    if (global.io) {
      global.io.emit('chartOfAccounts:created', {
        _id: ledgerAccount._id,
        code: ledgerAccount.code,
        name: ledgerAccount.name,
        type: accountType,
        isGroup: false
      });
    }

    return ledgerAccount._id;
  } catch (error) {
    logger.error('Failed to create ledger account', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contactId,
      contactName,
      isVendor
    });
    throw error;
  }
};