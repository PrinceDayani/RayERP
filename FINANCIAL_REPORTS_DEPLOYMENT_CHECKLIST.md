# Financial Reports - Deployment Checklist

## Pre-Deployment

### Code Review
- [ ] Review all changes in `financialReportController.ts`
- [ ] Review frontend changes in `FinancialReports.tsx`
- [ ] Verify route additions in `financialReport.routes.ts`
- [ ] Check TypeScript compilation: `npm run build`
- [ ] Run linter: `npm run lint`

### Testing
- [ ] Run test suite: `npm test`
- [ ] Test all 9 report types manually
- [ ] Test export functionality (CSV, JSON, PDF, Excel)
- [ ] Test pagination on General Ledger
- [ ] Test filters (department, cost center)
- [ ] Test date presets
- [ ] Test comparison periods
- [ ] Verify Trial Balance balances
- [ ] Test authentication (valid/invalid tokens)
- [ ] Test error handling (invalid dates, missing params)

### Database
- [ ] Backup production database
- [ ] Run migration script: `npm run migrate:financial-reports`
- [ ] Verify account categories updated
- [ ] Check indexes created
- [ ] Validate Trial Balance
- [ ] Test with production data sample

### Environment
- [ ] Verify `.env` configuration
- [ ] Check MongoDB connection string
- [ ] Verify JWT secret is secure
- [ ] Check CORS settings
- [ ] Verify API URL in frontend `.env.local`

---

## Deployment

### Backend Deployment
- [ ] Stop backend server
- [ ] Pull latest code: `git pull origin main`
- [ ] Install dependencies: `npm install`
- [ ] Build TypeScript: `npm run build`
- [ ] Run migration: `npm run migrate:financial-reports`
- [ ] Start server: `npm run start:prod`
- [ ] Verify health: `curl http://localhost:5000/api/health`

### Frontend Deployment
- [ ] Stop frontend server
- [ ] Pull latest code: `git pull origin main`
- [ ] Install dependencies: `npm install --legacy-peer-deps`
- [ ] Build Next.js: `npm run build`
- [ ] Start server: `npm start`
- [ ] Verify access: `http://localhost:3000/dashboard/finance/reports`

### Verification
- [ ] Test P&L report generation
- [ ] Test Balance Sheet
- [ ] Test Cash Flow
- [ ] Test Trial Balance (verify balanced)
- [ ] Test General Ledger pagination
- [ ] Test AR report with aging
- [ ] Test AP report with aging
- [ ] Test Expense Report
- [ ] Test Revenue Report
- [ ] Test export to CSV
- [ ] Test export to JSON
- [ ] Test department P&L
- [ ] Test budget comparison
- [ ] Test cache functionality
- [ ] Test authentication
- [ ] Check browser console for errors
- [ ] Check backend logs for errors

---

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Monitor API response times
- [ ] Check error logs: `tail -f backend/logs/error.log`
- [ ] Monitor database performance
- [ ] Check cache hit rates
- [ ] Monitor memory usage
- [ ] Track user feedback

### Documentation
- [ ] Update internal wiki
- [ ] Notify team of new features
- [ ] Share quick reference guide
- [ ] Schedule training session
- [ ] Update API documentation

### User Communication
- [ ] Announce new report types
- [ ] Highlight export functionality
- [ ] Explain date presets
- [ ] Demo department P&L
- [ ] Share troubleshooting guide

---

## Rollback Plan

### If Issues Occur
1. **Stop Services**
   ```bash
   # Backend
   pm2 stop rayerp-backend
   
   # Frontend
   pm2 stop rayerp-frontend
   ```

2. **Revert Code**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Restore Database**
   ```bash
   mongorestore --db rayerp backup/rayerp-backup-YYYYMMDD
   ```

4. **Restart Services**
   ```bash
   pm2 restart rayerp-backend
   pm2 restart rayerp-frontend
   ```

5. **Verify Rollback**
   - Test basic functionality
   - Check logs
   - Notify users

---

## Performance Benchmarks

### Expected Response Times
- [ ] P&L Report: < 2 seconds
- [ ] Balance Sheet: < 2 seconds
- [ ] Cash Flow: < 2 seconds
- [ ] Trial Balance: < 1 second
- [ ] General Ledger (paginated): < 1 second
- [ ] AR/AP Reports: < 2 seconds
- [ ] Export CSV: < 3 seconds
- [ ] Cached requests: < 100ms

### Database Queries
- [ ] Aggregation pipeline: < 1 second
- [ ] Index usage: Verify with `explain()`
- [ ] Connection pool: Monitor active connections

---

## Security Checklist

- [ ] JWT tokens expire correctly
- [ ] Unauthorized requests return 401
- [ ] Input validation working
- [ ] SQL injection prevention (N/A for MongoDB)
- [ ] XSS protection enabled
- [ ] CORS configured correctly
- [ ] Audit trail logging all actions
- [ ] Sensitive data not in logs
- [ ] HTTPS enabled (production)
- [ ] Rate limiting configured

---

## Compliance Checklist

- [ ] Audit trail captures all report generation
- [ ] User actions logged with timestamp
- [ ] Data retention policy configured
- [ ] Trial Balance validation working
- [ ] Financial data accuracy verified
- [ ] Export functionality secure
- [ ] Access control enforced

---

## Training Checklist

### For End Users
- [ ] How to generate reports
- [ ] How to use date presets
- [ ] How to export reports
- [ ] How to read financial metrics
- [ ] How to use filters
- [ ] Troubleshooting common issues

### For Administrators
- [ ] How to clear cache
- [ ] How to run migration
- [ ] How to monitor performance
- [ ] How to review audit logs
- [ ] How to handle errors
- [ ] Database maintenance

### For Developers
- [ ] API endpoint documentation
- [ ] Code structure overview
- [ ] How to add new report types
- [ ] How to modify existing reports
- [ ] Testing procedures
- [ ] Debugging techniques

---

## Success Criteria

### Functional
- [ ] All 9 report types generate correctly
- [ ] Export works for all formats
- [ ] Pagination works smoothly
- [ ] Filters apply correctly
- [ ] Charts render properly
- [ ] No console errors
- [ ] No backend errors

### Performance
- [ ] Response times meet benchmarks
- [ ] Cache reduces load by 80%+
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Handles concurrent users

### User Experience
- [ ] UI is responsive
- [ ] Error messages are clear
- [ ] Loading states visible
- [ ] Data is accurate
- [ ] Navigation is intuitive

---

## Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] Tests passed
- [ ] Documentation complete
- [ ] Signed off by: _________________ Date: _______

### QA Team
- [ ] All test cases passed
- [ ] Performance benchmarks met
- [ ] Security checks passed
- [ ] Signed off by: _________________ Date: _______

### Product Owner
- [ ] Features meet requirements
- [ ] User acceptance testing passed
- [ ] Ready for production
- [ ] Signed off by: _________________ Date: _______

### DevOps Team
- [ ] Deployment plan reviewed
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Signed off by: _________________ Date: _______

---

## Emergency Contacts

- **Backend Lead**: _________________
- **Frontend Lead**: _________________
- **Database Admin**: _________________
- **DevOps**: _________________
- **Product Owner**: _________________

---

## Post-Deployment Review (After 1 Week)

- [ ] Review error logs
- [ ] Analyze performance metrics
- [ ] Collect user feedback
- [ ] Identify improvements
- [ ] Plan next iteration
- [ ] Update documentation
- [ ] Schedule retrospective

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Version**: 3.0.0  
**Status**: ☐ Ready ☐ In Progress ☐ Complete ☐ Rolled Back
