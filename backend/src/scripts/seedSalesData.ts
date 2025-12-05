import mongoose from 'mongoose';
import Invoice from '../models/Invoice';
import User from '../models/User';

const seedSalesData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    const sampleSales = [
      {
        invoiceNumber: 'INV-2024-001',
        invoiceType: 'SALES',
        status: 'PAID',
        partyName: 'Acme Corporation',
        partyEmail: 'contact@acme.com',
        invoiceDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        currency: 'INR',
        exchangeRate: 1,
        baseCurrency: 'INR',
        lineItems: [{ description: 'Product A', quantity: 10, unitPrice: 5000, taxRate: 18, taxAmount: 9000, discount: 0, amount: 59000 }],
        subtotal: 50000,
        totalTax: 9000,
        totalDiscount: 0,
        totalAmount: 59000,
        amountInBaseCurrency: 59000,
        paidAmount: 59000,
        balanceAmount: 0,
        payments: [],
        paymentTerms: 'NET_30',
        lateFeeAmount: 0,
        gracePeriodDays: 0,
        isRecurring: false,
        approvalStatus: 'APPROVED',
        approvalWorkflow: [],
        isFactored: false,
        remindersSent: 0,
        dunningLevel: 0,
        attachments: [],
        createdBy: adminUser._id
      },
      {
        invoiceNumber: 'INV-2024-002',
        invoiceType: 'SALES',
        status: 'SENT',
        partyName: 'Tech Solutions Ltd',
        partyEmail: 'billing@techsolutions.com',
        invoiceDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        currency: 'INR',
        exchangeRate: 1,
        baseCurrency: 'INR',
        lineItems: [{ description: 'Service Package', quantity: 1, unitPrice: 75000, taxRate: 18, taxAmount: 13500, discount: 0, amount: 88500 }],
        subtotal: 75000,
        totalTax: 13500,
        totalDiscount: 0,
        totalAmount: 88500,
        amountInBaseCurrency: 88500,
        paidAmount: 0,
        balanceAmount: 88500,
        payments: [],
        paymentTerms: 'NET_30',
        lateFeeAmount: 0,
        gracePeriodDays: 0,
        isRecurring: false,
        approvalStatus: 'APPROVED',
        approvalWorkflow: [],
        isFactored: false,
        remindersSent: 0,
        dunningLevel: 0,
        attachments: [],
        createdBy: adminUser._id
      },
      {
        invoiceNumber: 'INV-2024-003',
        invoiceType: 'SALES',
        status: 'PARTIALLY_PAID',
        partyName: 'Global Enterprises',
        partyEmail: 'accounts@global.com',
        invoiceDate: new Date('2024-01-25'),
        dueDate: new Date('2024-02-25'),
        currency: 'INR',
        exchangeRate: 1,
        baseCurrency: 'INR',
        lineItems: [{ description: 'Consulting Services', quantity: 20, unitPrice: 3000, taxRate: 18, taxAmount: 10800, discount: 0, amount: 70800 }],
        subtotal: 60000,
        totalTax: 10800,
        totalDiscount: 0,
        totalAmount: 70800,
        amountInBaseCurrency: 70800,
        paidAmount: 35000,
        balanceAmount: 35800,
        payments: [],
        paymentTerms: 'NET_30',
        lateFeeAmount: 0,
        gracePeriodDays: 0,
        isRecurring: false,
        approvalStatus: 'APPROVED',
        approvalWorkflow: [],
        isFactored: false,
        remindersSent: 1,
        dunningLevel: 0,
        attachments: [],
        createdBy: adminUser._id
      }
    ];

    await Invoice.insertMany(sampleSales);
    console.log('✅ Sample sales data seeded successfully');
    
  } catch (error) {
    console.error('Error seeding sales data:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedSalesData();
