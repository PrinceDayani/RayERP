import Contact from '../models/Contact';
import ChartOfAccount from '../models/ChartOfAccount';
import Notification from '../models/Notification';
import { logger } from './logger';

export const createContactFromAccount = async (
  accountId: string,
  accountData: any,
  userId: string
) => {
  try {
    const account = await ChartOfAccount.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Check if account already has a contact
    if (account.contactId) {
      logger.info('Account already has contact', { accountId, contactId: account.contactId });
      return account.contactId;
    }

    // Determine if customer or vendor based on account type
    const isCustomer = account.type === 'ASSET' && account.subType?.includes('Receivable');
    const isVendor = account.type === 'LIABILITY' && account.subType?.includes('Payable');

    if (!isCustomer && !isVendor) {
      logger.info('Account is neither customer nor vendor type', { accountId, type: account.type });
      return null;
    }

    // Extract contact info from account
    const contactData: any = {
      name: account.name.replace(/ - (Customer|Vendor) Account$/, ''),
      phone: accountData.contactInfo?.phone || '0000000000',
      email: accountData.contactInfo?.email,
      address: accountData.contactInfo?.address,
      isCustomer,
      isVendor,
      ledgerAccountId: accountId,
      visibilityLevel: 'universal',
      contactType: isVendor ? 'vendor' : 'client',
      status: 'active',
      createdBy: userId
    };

    const contact = await Contact.create(contactData);

    // Update account with contact ID
    await ChartOfAccount.findByIdAndUpdate(accountId, {
      contactId: contact._id
    });

    logger.info(`Contact auto-created from ${isVendor ? 'vendor' : 'customer'} account`, {
      accountId,
      contactId: contact._id
    });

    // Create notification
    const notification = await Notification.create({
      userId,
      type: 'success',
      title: 'Contact Auto-Created',
      message: `Contact "${contact.name}" has been automatically created from account.`,
      priority: 'low',
      actionUrl: `/dashboard/contacts/${contact._id}`,
      metadata: { contactId: contact._id, accountId }
    });

    // Emit real-time notification
    if (global.io) {
      global.io.to(userId).emit('notification:new', notification);
      global.io.emit('contact:created', {
        _id: contact._id,
        name: contact.name,
        isCustomer,
        isVendor
      });
    }

    return contact._id;
  } catch (error) {
    logger.error('Failed to create contact from account', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      accountId
    });
    throw error;
  }
};
