import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateRequiredFields } from '../middleware/validation.middleware';
import { body, query } from 'express-validator';

const router = express.Router();

// Tax Management Routes

// Get all tax records
router.get('/', protect, async (req, res) => {
  try {
    // Mock data for now - replace with actual database queries
    const taxRecords = [
      {
        id: '1',
        type: 'GST',
        amount: 25000,
        rate: 18,
        status: 'Filed',
        dueDate: '2024-01-20',
        period: 'Dec 2023',
        description: 'Monthly GST Return'
      },
      {
        id: '2',
        type: 'TDS',
        amount: 15000,
        rate: 10,
        status: 'Pending',
        dueDate: '2024-01-15',
        period: 'Q3 2023',
        description: 'TDS on Salary'
      }
    ];

    res.json({
      success: true,
      data: taxRecords,
      total: taxRecords.length
    });
  } catch (error) {
    console.error('Error fetching tax records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax records'
    });
  }
});

// Get tax statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = {
      totalTax: 90000,
      pendingReturns: 2,
      overduePayments: 1,
      complianceScore: 85
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching tax stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax statistics'
    });
  }
});

// Create new tax entry
router.post('/', 
  protect,
  [
    body('type').isIn(['GST', 'VAT', 'TDS', 'Income Tax', 'Sales Tax']).withMessage('Invalid tax type'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('rate').isNumeric().withMessage('Rate must be a number'),
    body('period').notEmpty().withMessage('Period is required'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  validateRequiredFields(['type', 'amount', 'rate', 'period', 'description']),
  async (req, res) => {
    try {
      const { type, amount, rate, period, description, dueDate } = req.body;

      // Mock creation - replace with actual database insertion
      const newTaxRecord = {
        id: Date.now().toString(),
        type,
        amount,
        rate,
        period,
        description,
        dueDate,
        status: 'Pending',
        createdAt: new Date(),
        createdBy: req.user.id
      };

      res.status(201).json({
        success: true,
        data: newTaxRecord,
        message: 'Tax record created successfully'
      });
    } catch (error) {
      console.error('Error creating tax record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tax record'
      });
    }
  }
);

// Update tax record
router.put('/:id',
  protect,
  [
    body('status').optional().isIn(['Pending', 'Filed', 'Paid', 'Overdue']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Mock update - replace with actual database update
      const updatedRecord = {
        id,
        ...updates,
        updatedAt: new Date(),
        updatedBy: req.user.id
      };

      res.json({
        success: true,
        data: updatedRecord,
        message: 'Tax record updated successfully'
      });
    } catch (error) {
      console.error('Error updating tax record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tax record'
      });
    }
  }
);

// Calculate TDS
router.post('/calculate-tds',
  protect,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('rate').isNumeric().withMessage('Rate must be a number')
  ],
  validateRequiredFields(['amount', 'rate']),
  async (req, res) => {
    try {
      const { amount, rate } = req.body;
      const tdsAmount = (amount * rate) / 100;
      const netAmount = amount - tdsAmount;

      res.json({
        success: true,
        data: {
          grossAmount: amount,
          tdsRate: rate,
          tdsAmount,
          netAmount
        }
      });
    } catch (error) {
      console.error('Error calculating TDS:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate TDS'
      });
    }
  }
);

// Calculate income tax
router.post('/calculate-income-tax',
  protect,
  [
    body('income').isNumeric().withMessage('Income must be a number'),
    body('deductions').optional().isNumeric().withMessage('Deductions must be a number')
  ],
  validateRequiredFields(['income']),
  async (req, res) => {
    try {
      const { income, deductions = 0 } = req.body;
      const taxableIncome = income - deductions;
      
      let tax = 0;
      if (taxableIncome > 1000000) {
        tax = 112500 + (taxableIncome - 1000000) * 0.3;
      } else if (taxableIncome > 500000) {
        tax = 12500 + (taxableIncome - 500000) * 0.2;
      } else if (taxableIncome > 250000) {
        tax = (taxableIncome - 250000) * 0.05;
      }

      res.json({
        success: true,
        data: {
          grossIncome: income,
          deductions,
          taxableIncome,
          calculatedTax: tax,
          netIncome: income - tax
        }
      });
    } catch (error) {
      console.error('Error calculating income tax:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate income tax'
      });
    }
  }
);

// Get GST returns
router.get('/gst-returns', protect, async (req, res) => {
  try {
    const gstReturns = [
      { type: 'GSTR-1', status: 'Filed', dueDate: '2024-01-11', period: 'Dec 2023' },
      { type: 'GSTR-3B', status: 'Pending', dueDate: '2024-01-20', period: 'Dec 2023' },
      { type: 'GSTR-9', status: 'Due Soon', dueDate: '2024-03-31', period: 'FY 2023-24' }
    ];

    res.json({
      success: true,
      data: gstReturns
    });
  } catch (error) {
    console.error('Error fetching GST returns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GST returns'
    });
  }
});

export default router;