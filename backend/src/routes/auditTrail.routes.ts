import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { validateRequiredFields } from '../middleware/validation.middleware';
const { query } = require('express-validator');

const router = express.Router();

// Audit Trail Routes

// Get audit logs
router.get('/',
  protect,
  requirePermission('audit.view'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('module').optional().isString().withMessage('Module must be a string'),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'VIEW']).withMessage('Invalid action'),
    query('user').optional().isString().withMessage('User must be a string'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ],
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        module,
        action,
        user,
        startDate,
        endDate
      } = req.query;

      // Mock audit logs - replace with actual database queries
      const auditLogs = [
        {
          id: '1',
          timestamp: '2024-01-15T10:30:00Z',
          user: 'john.doe@company.com',
          action: 'CREATE',
          module: 'Journal Entry',
          recordId: 'JE-2024-001',
          oldValue: '',
          newValue: 'Amount: ₹50,000',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'Success'
        },
        {
          id: '2',
          timestamp: '2024-01-15T09:15:00Z',
          user: 'jane.smith@company.com',
          action: 'UPDATE',
          module: 'Invoice',
          recordId: 'INV-2024-001',
          oldValue: 'Status: Draft',
          newValue: 'Status: Approved',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'Success'
        },
        {
          id: '3',
          timestamp: '2024-01-15T08:45:00Z',
          user: 'mike.johnson@company.com',
          action: 'DELETE',
          module: 'Payment',
          recordId: 'PAY-2024-001',
          oldValue: 'Amount: ₹25,000',
          newValue: '',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'Failed'
        }
      ];

      // Apply filters (mock implementation)
      let filteredLogs = auditLogs;
      if (module) {
        filteredLogs = filteredLogs.filter(log => log.module.toLowerCase().includes(module.toString().toLowerCase()));
      }
      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }
      if (user) {
        filteredLogs = filteredLogs.filter(log => log.user.toLowerCase().includes(user.toString().toLowerCase()));
      }

      const total = filteredLogs.length;
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedLogs = filteredLogs.slice(startIndex, startIndex + Number(limit));

      res.json({
        success: true,
        data: paginatedLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs'
      });
    }
  }
);

// Get audit log statistics
router.get('/stats', protect, requirePermission('audit.view'), async (req, res) => {
  try {
    const stats = {
      totalLogs: 1250,
      successfulActions: 1180,
      failedActions: 70,
      uniqueUsers: 25,
      topModules: [
        { module: 'Journal Entry', count: 450 },
        { module: 'Invoice', count: 320 },
        { module: 'Payment', count: 280 },
        { module: 'Budget', count: 120 },
        { module: 'Voucher', count: 80 }
      ],
      topUsers: [
        { user: 'john.doe@company.com', count: 250 },
        { user: 'jane.smith@company.com', count: 180 },
        { user: 'mike.johnson@company.com', count: 120 }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics'
    });
  }
});

// Get audit log by ID
router.get('/:id', protect, requirePermission('audit.view'), async (req, res) => {
  try {
    const { id } = req.params;

    // Mock detailed audit log
    const auditLog = {
      id,
      timestamp: '2024-01-15T10:30:00Z',
      user: 'john.doe@company.com',
      action: 'CREATE',
      module: 'Journal Entry',
      recordId: 'JE-2024-001',
      oldValue: '',
      newValue: JSON.stringify({
        amount: 50000,
        description: 'Office rent payment',
        accounts: [
          { account: 'Rent Expense', debit: 50000 },
          { account: 'Cash', credit: 50000 }
        ]
      }),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'Success',
      sessionId: 'sess_abc123',
      requestId: 'req_xyz789',
      additionalData: {
        referrer: '/dashboard/finance/journal-entry',
        method: 'POST',
        endpoint: '/api/journal-entries',
        responseTime: 245
      }
    };

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log details'
    });
  }
});

// Export audit logs
router.post('/export',
  protect,
  requirePermission('logs.export'),
  async (req, res) => {
    try {
      const { format = 'csv', filters = {} } = req.body;

      // Mock export generation
      const exportJob = {
        jobId: Date.now().toString(),
        format,
        filters,
        status: 'Processing',
        createdAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 60000) // 1 minute from now
      };

      res.json({
        success: true,
        data: exportJob,
        message: 'Export job started successfully'
      });
    } catch (error) {
      console.error('Error starting export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start export job'
      });
    }
  }
);

// Get compliance report
router.get('/compliance/report', protect, requirePermission('audit.view'), async (req, res) => {
  try {
    const complianceReport = {
      reportDate: new Date(),
      period: 'Q4 2023',
      compliance: {
        sox: {
          score: 98,
          status: 'Compliant',
          controlsActive: 45,
          controlsTotal: 46,
          lastAudit: '2023-12-15'
        },
        dataRetention: {
          score: 100,
          status: 'Compliant',
          retentionPeriod: '7 years',
          recordsRetained: 125000,
          recordsArchived: 50000
        },
        accessControl: {
          score: 95,
          status: 'Compliant',
          roleBasedAccess: true,
          mfaEnabled: true,
          lastReview: '2024-01-01'
        }
      },
      auditTrail: {
        totalLogs: 1250,
        integrityScore: 100,
        completenessScore: 98,
        availabilityScore: 100
      },
      recommendations: [
        'Review user access permissions quarterly',
        'Implement automated compliance monitoring',
        'Update data retention policies'
      ]
    };

    res.json({
      success: true,
      data: complianceReport
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate compliance report'
    });
  }
});

// Get security events
router.get('/security/events', protect, requirePermission('audit.view'), async (req, res) => {
  try {
    const securityEvents = [
      {
        id: '1',
        timestamp: '2024-01-15T08:30:00Z',
        type: 'Failed Login',
        severity: 'High',
        description: 'Multiple failed login attempts detected',
        ipAddress: '192.168.1.999',
        user: 'unknown',
        status: 'Active',
        riskScore: 85
      },
      {
        id: '2',
        timestamp: '2024-01-15T06:15:00Z',
        type: 'Unusual Access',
        severity: 'Medium',
        description: 'Access from new location detected',
        ipAddress: '203.0.113.1',
        user: 'john.doe@company.com',
        status: 'Resolved',
        riskScore: 45
      }
    ];

    res.json({
      success: true,
      data: securityEvents
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security events'
    });
  }
});

// Create audit log entry (internal use)
router.post('/log',
  protect,
  requirePermission('audit.view'),
  async (req, res) => {
    try {
      const {
        action,
        module,
        recordId,
        oldValue,
        newValue,
        additionalData
      } = req.body;

      const auditLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        user: req.user.email,
        action,
        module,
        recordId,
        oldValue: oldValue || '',
        newValue: newValue || '',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'Success',
        additionalData
      };

      // In a real implementation, save to database
      console.log('Audit log created:', auditLog);

      res.status(201).json({
        success: true,
        data: auditLog,
        message: 'Audit log created successfully'
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audit log'
      });
    }
  }
);

export default router;