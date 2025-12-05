import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateRequiredFields } from '../middleware/validation.middleware';
const { query } = require('express-validator');

const router = express.Router();

// Aging Analysis Routes

// Get aging analysis data
router.get('/',
  protect,
  [
    query('type').optional().isIn(['receivables', 'payables']).withMessage('Type must be receivables or payables'),
    query('asOfDate').optional().isISO8601().withMessage('Invalid date format')
  ],
  async (req, res) => {
    try {
      const { type = 'receivables', asOfDate = new Date() } = req.query;

      // Mock aging data - replace with actual database queries
      const agingData = [
        {
          id: '1',
          customerName: 'ABC Corp Ltd',
          invoiceNumber: 'INV-2023-001',
          amount: 50000,
          dueDate: '2023-12-15',
          daysOverdue: 45,
          agingBucket: '31-60',
          status: 'Overdue',
          contactInfo: 'finance@abccorp.com'
        },
        {
          id: '2',
          customerName: 'XYZ Industries',
          invoiceNumber: 'INV-2023-002',
          amount: 75000,
          dueDate: '2023-11-20',
          daysOverdue: 70,
          agingBucket: '61-90',
          status: 'Critical',
          contactInfo: 'accounts@xyzind.com'
        },
        {
          id: '3',
          customerName: 'Tech Solutions Inc',
          invoiceNumber: 'INV-2024-001',
          amount: 25000,
          dueDate: '2024-01-30',
          daysOverdue: 0,
          agingBucket: '0-30',
          status: 'Current',
          contactInfo: 'billing@techsol.com'
        }
      ];

      res.json({
        success: true,
        data: agingData,
        type,
        asOfDate
      });
    } catch (error) {
      console.error('Error fetching aging analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch aging analysis'
      });
    }
  }
);

// Get aging summary statistics
router.get('/summary',
  protect,
  [
    query('type').optional().isIn(['receivables', 'payables']).withMessage('Type must be receivables or payables')
  ],
  async (req, res) => {
    try {
      const { type = 'receivables' } = req.query;

      // Mock summary data
      const summary = {
        totalOutstanding: 150000,
        current: 25000,
        overdue30: 50000,
        overdue60: 75000,
        overdue90: 0,
        criticalAccounts: 1,
        averageDaysOutstanding: 42,
        collectionEfficiency: 78,
        badDebtRisk: 75000
      };

      res.json({
        success: true,
        data: summary,
        type
      });
    } catch (error) {
      console.error('Error fetching aging summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch aging summary'
      });
    }
  }
);

// Get aging buckets breakdown
router.get('/buckets',
  protect,
  [
    query('type').optional().isIn(['receivables', 'payables']).withMessage('Type must be receivables or payables')
  ],
  async (req, res) => {
    try {
      const { type = 'receivables' } = req.query;

      const buckets = [
        {
          bucket: '0-30',
          amount: 25000,
          count: 1,
          percentage: 16.7,
          color: 'green'
        },
        {
          bucket: '31-60',
          amount: 50000,
          count: 1,
          percentage: 33.3,
          color: 'yellow'
        },
        {
          bucket: '61-90',
          amount: 75000,
          count: 1,
          percentage: 50.0,
          color: 'orange'
        },
        {
          bucket: '90+',
          amount: 0,
          count: 0,
          percentage: 0,
          color: 'red'
        }
      ];

      res.json({
        success: true,
        data: buckets,
        type
      });
    } catch (error) {
      console.error('Error fetching aging buckets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch aging buckets'
      });
    }
  }
);

// Get customer/vendor aging details
router.get('/customer/:customerId',
  protect,
  async (req, res) => {
    try {
      const { customerId } = req.params;

      // Mock customer aging details
      const customerAging = {
        customerId,
        customerName: 'ABC Corp Ltd',
        totalOutstanding: 50000,
        creditLimit: 100000,
        paymentTerms: 'NET 30',
        lastPayment: '2023-11-15',
        invoices: [
          {
            invoiceNumber: 'INV-2023-001',
            amount: 50000,
            dueDate: '2023-12-15',
            daysOverdue: 45,
            status: 'Overdue'
          }
        ],
        paymentHistory: [
          {
            date: '2023-11-15',
            amount: 30000,
            method: 'Bank Transfer'
          }
        ]
      };

      res.json({
        success: true,
        data: customerAging
      });
    } catch (error) {
      console.error('Error fetching customer aging:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer aging details'
      });
    }
  }
);

// Generate aging report
router.post('/report',
  protect,
  async (req, res) => {
    try {
      const { type = 'receivables', format = 'pdf', asOfDate = new Date() } = req.body;

      // Mock report generation
      const report = {
        reportId: Date.now().toString(),
        type,
        format,
        asOfDate,
        generatedAt: new Date(),
        downloadUrl: `/reports/aging-${type}-${Date.now()}.${format}`,
        status: 'Generated'
      };

      res.json({
        success: true,
        data: report,
        message: 'Aging report generated successfully'
      });
    } catch (error) {
      console.error('Error generating aging report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate aging report'
      });
    }
  }
);

// Send payment reminders
router.post('/send-reminders',
  protect,
  async (req, res) => {
    try {
      const { customerIds, template = 'default' } = req.body;

      // Mock reminder sending
      const reminderResults = customerIds.map((customerId: string) => ({
        customerId,
        status: 'Sent',
        sentAt: new Date(),
        method: 'Email'
      }));

      res.json({
        success: true,
        data: reminderResults,
        message: `Payment reminders sent to ${customerIds.length} customers`
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send payment reminders'
      });
    }
  }
);

// Get aging trends
router.get('/trends',
  protect,
  [
    query('period').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period'),
    query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
  ],
  async (req, res) => {
    try {
      const { period = 'monthly', months = 12 } = req.query;

      // Mock trend data
      const trends = Array.from({ length: Number(months) }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        return {
          period: date.toISOString().slice(0, 7), // YYYY-MM format
          totalOutstanding: 150000 + (Math.random() - 0.5) * 50000,
          current: 25000 + (Math.random() - 0.5) * 10000,
          overdue30: 50000 + (Math.random() - 0.5) * 20000,
          overdue60: 75000 + (Math.random() - 0.5) * 30000,
          overdue90: Math.random() * 20000,
          averageDaysOutstanding: 42 + (Math.random() - 0.5) * 20
        };
      }).reverse();

      res.json({
        success: true,
        data: trends,
        period
      });
    } catch (error) {
      console.error('Error fetching aging trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch aging trends'
      });
    }
  }
);

export default router;