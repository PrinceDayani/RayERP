import mongoose from 'mongoose';
import { Invoice } from '../models/Finance';
import Contact from '../models/Contact';
import User from '../models/User';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';

dotenv.config();

const populateSalesData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to database');

    const adminUser = await User.findOne().sort({ createdAt: 1 }).limit(1);
    if (!adminUser) {
      console.log('❌ No user found. Please create a user first.');
      process.exit(1);
    }
    console.log(`✅ Using user: ${adminUser.name || adminUser.email}`);

    // Get or create contacts
    let contacts = await Contact.find({ contactType: 'client', status: 'active' }).limit(10);
    
    if (contacts.length === 0) {
      console.log('📝 Creating sample contacts...');
      const sampleContacts = [
        { name: 'Acme Corporation', email: 'contact@acme.com', phone: '9876543210', company: 'Acme Corp', contactType: 'client' as const, status: 'active' as const, createdBy: adminUser._id },
        { name: 'Tech Solutions Ltd', email: 'billing@techsolutions.com', phone: '9876543211', company: 'Tech Solutions', contactType: 'client' as const, status: 'active' as const, createdBy: adminUser._id },
        { name: 'Global Enterprises', email: 'accounts@global.com', phone: '9876543212', company: 'Global Ent', contactType: 'client' as const, status: 'active' as const, createdBy: adminUser._id },
        { name: 'Innovate Systems', email: 'info@innovate.com', phone: '9876543213', company: 'Innovate', contactType: 'client' as const, status: 'active' as const, createdBy: adminUser._id },
        { name: 'Digital Dynamics', email: 'sales@digital.com', phone: '9876543214', company: 'Digital Dynamics', contactType: 'client' as const, status: 'active' as const, createdBy: adminUser._id }
      ];
      contacts = await Contact.insertMany(sampleContacts);
      console.log(`✅ Created ${contacts.length} contacts`);
    }

    // Get sales account
    let salesAccount = await ChartOfAccount.findOne({ name: /sales|revenue/i });
    
    // Clear existing sales invoices
    await Invoice.deleteMany({ invoiceType: 'SALES' });
    console.log('🗑️  Cleared existing sales invoices');

    // Generate sales data
    const salesData = [];
    const statuses = ['PAID', 'SENT', 'PARTIALLY_PAID', 'APPROVED'];
    const products = [
      { name: 'Software License', price: 50000 },
      { name: 'Consulting Services', price: 75000 },
      { name: 'Support Package', price: 30000 },
      { name: 'Training Program', price: 45000 },
      { name: 'Custom Development', price: 120000 },
      { name: 'Cloud Services', price: 25000 },
      { name: 'Maintenance Contract', price: 60000 }
    ];

    let invoiceCounter = 1;
    const today = new Date();

    for (let i = 0; i < 20; i++) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const subtotal = product.price * quantity;
      const taxRate = 18;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let paidAmount = 0;
      if (status === 'PAID') paidAmount = totalAmount;
      else if (status === 'PARTIALLY_PAID') paidAmount = totalAmount * 0.5;

      const daysAgo = Math.floor(Math.random() * 90);
      const invoiceDate = new Date(today);
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
      
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      salesData.push({
        invoiceNumber: `INV-2024-${String(invoiceCounter++).padStart(4, '0')}`,
        invoiceType: 'SALES',
        status,
        customerId: contact._id,
        partyName: contact.name,
        partyEmail: contact.email,
        invoiceDate,
        dueDate,
        currency: 'INR',
        exchangeRate: 1,
        baseCurrency: 'INR',
        lineItems: [{
          description: product.name,
          quantity,
          unitPrice: product.price,
          taxRate,
          taxAmount: (product.price * quantity * taxRate) / 100,
          discount: 0,
          amount: product.price * quantity + (product.price * quantity * taxRate) / 100,
          account: salesAccount?._id
        }],
        subtotal,
        totalTax: taxAmount,
        totalDiscount: 0,
        totalAmount,
        amountInBaseCurrency: totalAmount,
        paidAmount,
        balanceAmount: totalAmount - paidAmount,
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
      });
    }

    await Invoice.insertMany(salesData);
    console.log(`✅ Created ${salesData.length} sales invoices`);

    const summary = await Invoice.aggregate([
      { $match: { invoiceType: 'SALES' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (summary.length > 0) {
      console.log('\n📊 Sales Summary:');
      console.log(`   Total Invoices: ${summary[0].count}`);
      console.log(`   Total Revenue: ₹${summary[0].totalRevenue.toLocaleString()}`);
      console.log(`   Total Paid: ₹${summary[0].totalPaid.toLocaleString()}`);
      console.log(`   Pending: ₹${(summary[0].totalRevenue - summary[0].totalPaid).toLocaleString()}`);
    }

    console.log('\n✅ Sales data populated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

populateSalesData();
