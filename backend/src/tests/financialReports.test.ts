/**
 * Financial Reports Test Suite
 * Run: npm test -- financialReports.test.ts
 */

import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';

describe('Financial Reports API', () => {
  let authToken: string;
  let testAccountId: string;

  beforeAll(async () => {
    // Login and get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    
    authToken = loginRes.body.token;

    // Create test account
    const account = await ChartOfAccount.create({
      code: 'TEST-001',
      name: 'Test Revenue Account',
      type: 'REVENUE',
      subType: 'sales',
      category: 'Sales Revenue',
      isActive: true
    });
    testAccountId = account._id.toString();

    // Create test ledger entry
    await Ledger.create({
      accountId: testAccountId,
      date: new Date('2024-01-15'),
      description: 'Test Transaction',
      debit: 0,
      credit: 10000,
      reference: 'TEST-001'
    });
  });

  afterAll(async () => {
    // Cleanup
    await ChartOfAccount.findByIdAndDelete(testAccountId);
    await Ledger.deleteMany({ accountId: testAccountId });
    await mongoose.disconnect();
  });

  describe('GET /api/financial-reports/profit-loss', () => {
    it('should return P&L report with valid date range', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('expenses');
      expect(res.body.data).toHaveProperty('netIncome');
      expect(res.body.data).toHaveProperty('margins');
    });

    it('should return 400 for missing dates', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid date range', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ startDate: '2024-12-31', endDate: '2024-01-01' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('should include budget comparison when requested', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ 
          startDate: '2024-01-01', 
          endDate: '2024-12-31',
          includeBudget: 'true'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('budget');
    });
  });

  describe('GET /api/financial-reports/balance-sheet', () => {
    it('should return balance sheet', async () => {
      const res = await request(app)
        .get('/api/financial-reports/balance-sheet')
        .query({ asOfDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('assets');
      expect(res.body.data).toHaveProperty('liabilities');
      expect(res.body.data).toHaveProperty('equity');
      expect(res.body.data).toHaveProperty('balanced');
    });

    it('should calculate ratios correctly', async () => {
      const res = await request(app)
        .get('/api/financial-reports/balance-sheet')
        .query({ asOfDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data).toHaveProperty('ratios');
      expect(res.body.data.ratios).toHaveProperty('currentRatio');
      expect(res.body.data.ratios).toHaveProperty('debtToEquity');
    });
  });

  describe('GET /api/financial-reports/cash-flow', () => {
    it('should return cash flow statement', async () => {
      const res = await request(app)
        .get('/api/financial-reports/cash-flow')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('operatingActivities');
      expect(res.body.data).toHaveProperty('investingActivities');
      expect(res.body.data).toHaveProperty('financingActivities');
      expect(res.body.data).toHaveProperty('netCashFlow');
    });
  });

  describe('GET /api/financial-reports/trial-balance', () => {
    it('should return trial balance', async () => {
      const res = await request(app)
        .get('/api/financial-reports/trial-balance')
        .query({ asOfDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accounts');
      expect(res.body.data).toHaveProperty('totalDebit');
      expect(res.body.data).toHaveProperty('totalCredit');
      expect(res.body.data).toHaveProperty('balanced');
    });

    it('should validate balance', async () => {
      const res = await request(app)
        .get('/api/financial-reports/trial-balance')
        .query({ asOfDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      const { totalDebit, totalCredit } = res.body.data;
      expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.01);
    });
  });

  describe('GET /api/financial-reports/general-ledger', () => {
    it('should return paginated ledger entries', async () => {
      const res = await request(app)
        .get('/api/financial-reports/general-ledger')
        .query({ 
          startDate: '2024-01-01', 
          endDate: '2024-12-31',
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('entries');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination).toHaveProperty('page');
      expect(res.body.data.pagination).toHaveProperty('total');
    });
  });

  describe('GET /api/financial-reports/accounts-receivable', () => {
    it('should return AR report with aging', async () => {
      const res = await request(app)
        .get('/api/financial-reports/accounts-receivable')
        .query({ asOfDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('aging');
      expect(res.body.data).toHaveProperty('totals');
    });
  });

  describe('GET /api/financial-reports/accounts-payable', () => {
    it('should return AP report with aging', async () => {
      const res = await request(app)
        .get('/api/financial-reports/accounts-payable')
        .query({ asOfDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('aging');
      expect(res.body.data).toHaveProperty('totals');
    });
  });

  describe('GET /api/financial-reports/expense-report', () => {
    it('should return expense report by category', async () => {
      const res = await request(app)
        .get('/api/financial-reports/expense-report')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('expenses');
      expect(res.body.data).toHaveProperty('byCategory');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/financial-reports/revenue-report', () => {
    it('should return revenue report by category', async () => {
      const res = await request(app)
        .get('/api/financial-reports/revenue-report')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('byCategory');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/financial-reports/export', () => {
    it('should export report as CSV', async () => {
      const res = await request(app)
        .get('/api/financial-reports/export')
        .query({ 
          reportType: 'profit-loss',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          format: 'csv'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('should export report as JSON', async () => {
      const res = await request(app)
        .get('/api/financial-reports/export')
        .query({ 
          reportType: 'balance-sheet',
          asOfDate: '2024-12-31',
          format: 'json'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET /api/financial-reports/profit-loss/by-department', () => {
    it('should return department-wise P&L', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss/by-department')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('departments');
      expect(res.body.data).toHaveProperty('totals');
    });
  });

  describe('POST /api/financial-reports/clear-cache', () => {
    it('should clear report cache', async () => {
      const res = await request(app)
        .post('/api/financial-reports/clear-cache')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Performance', () => {
    it('should return cached data on second request', async () => {
      const start1 = Date.now();
      await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const res2 = await request(app)
        .get('/api/financial-reports/profit-loss')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken}`);
      const time2 = Date.now() - start2;

      expect(res2.body.cached).toBe(true);
      expect(time2).toBeLessThan(time1);
    });
  });
});
