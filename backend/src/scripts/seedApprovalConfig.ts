import mongoose from 'mongoose';
import ApprovalConfig from '../models/ApprovalConfig';

const seedApprovalConfig = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');

    await ApprovalConfig.deleteMany({});

    await ApprovalConfig.create({
      entityType: 'DepartmentBudget',
      levels: [
        { level: 1, approverRole: 'Manager', amountThreshold: 50000 },
        { level: 2, approverRole: 'Finance Manager', amountThreshold: 200000 },
        { level: 3, approverRole: 'CFO', amountThreshold: 1000000 }
      ],
      isActive: true
    });

    await ApprovalConfig.create({
      entityType: 'JOURNAL',
      levels: [
        { level: 1, approverRole: 'Manager', amountThreshold: 50000 },
        { level: 2, approverRole: 'Finance Manager', amountThreshold: 200000 },
        { level: 3, approverRole: 'CFO', amountThreshold: 1000000 }
      ],
      isActive: true
    });

    await ApprovalConfig.create({
      entityType: 'PAYMENT',
      levels: [
        { level: 1, approverRole: 'Manager', amountThreshold: 50000 },
        { level: 2, approverRole: 'Finance Manager', amountThreshold: 200000 },
        { level: 3, approverRole: 'CFO', amountThreshold: 1000000 }
      ],
      isActive: true
    });

    await ApprovalConfig.create({
      entityType: 'INVOICE',
      levels: [
        { level: 1, approverRole: 'Manager', amountThreshold: 50000 },
        { level: 2, approverRole: 'Finance Manager', amountThreshold: 200000 },
        { level: 3, approverRole: 'CFO', amountThreshold: 1000000 }
      ],
      isActive: true
    });

    await ApprovalConfig.create({
      entityType: 'EXPENSE',
      levels: [
        { level: 1, approverRole: 'Manager', amountThreshold: 50000 },
        { level: 2, approverRole: 'Finance Manager', amountThreshold: 200000 },
        { level: 3, approverRole: 'CFO', amountThreshold: 1000000 }
      ],
      isActive: true
    });

    await ApprovalConfig.create({
      entityType: 'VOUCHER',
      levels: [
        { level: 1, approverRole: 'Manager', amountThreshold: 50000 },
        { level: 2, approverRole: 'Finance Manager', amountThreshold: 200000 },
        { level: 3, approverRole: 'CFO', amountThreshold: 1000000 }
      ],
      isActive: true
    });

    console.log('Approval configuration seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding approval config:', error);
    process.exit(1);
  }
};

seedApprovalConfig();
