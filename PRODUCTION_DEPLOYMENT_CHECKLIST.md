# Cash Flow System - Production Deployment Checklist

## ✅ Pre-Deployment

### 1. Install Dependencies
```bash
cd backend
npm install express-validator
```

### 2. Add Routes to Server
In `backend/src/server.ts`:
```typescript
import cashFlowManagementRoutes from './routes/cashFlowManagement.routes';

// Add after other routes
app.use('/api/cash-flow-management', cashFlowManagementRoutes);
```

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "migrate:cashflow": "ts-node src/scripts/migrateCashFlowCategories.ts",
    "seed:cashflow": "ts-node src/scripts/seedCashFlowData.ts"
  }
}
```

### 4. Environment Variables
Ensure these are set in `.env`:
```env
MONGO_URI=mongodb://localhost:27017/rayerp
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🚀 Deployment Steps

### Step 1: Backup Database
```bash
mongodump --db rayerp --out ./backup-$(date +%Y%m%d)
```

### Step 2: Run Migration
```bash
npm run migrate:cashflow
```

Expected output:
```
Connected to MongoDB
Found X cash accounts
Found Y ledger entries to migrate
Migrated 100 entries...
✅ Migration complete! Updated Y ledger entries
```

### Step 3: Verify Migration
```bash
# Check entries with categories
mongo rayerp --eval "db.ledgers.countDocuments({cashFlowCategory: {$exists: true}})"

# Check entries needing review
mongo rayerp --eval "db.ledgers.countDocuments({needsReview: true})"
```

### Step 4: Start Server
```bash
npm run build:prod
npm run start:prod
```

### Step 5: Health Check
```bash
# Test API availability
curl http://localhost:5000/api/health

# Test cash flow management
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/cash-flow-management/statistics
```

---

## 🧪 Testing

### Test 1: Get Entries Needing Review
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/cash-flow-management/entries/needs-review?page=1&limit=10"
```

Expected: List of entries with `needsReview: true`

### Test 2: Override Category
```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"INVESTING","reason":"Equipment purchase"}' \
  http://localhost:5000/api/cash-flow-management/entries/LEDGER_ID/override
```

Expected: `{ success: true, data: {...} }`

### Test 3: Create Rule
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Salary = Operating",
    "category":"OPERATING",
    "priority":10,
    "conditions":{"descriptionContains":["salary","wage"]}
  }' \
  http://localhost:5000/api/cash-flow-management/rules
```

Expected: `{ success: true, data: {...} }`

### Test 4: Reconciliation
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/cash-flow-management/reconciliation?startDate=2024-01-01&endDate=2024-12-31"
```

Expected: `{ success: true, data: { variance: ~0, isReconciled: true } }`

### Test 5: Cash Flow Report (Both Methods)
```bash
# Indirect method
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/financial-reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31"

# Direct method
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/financial-reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31&method=direct"
```

Expected: Cash flow data with opening/closing balances

---

## 📊 Monitoring

### Key Metrics to Track

1. **Categorization Accuracy**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/cash-flow-management/statistics
```
Monitor: `reviewPercentage` should decrease over time as rules improve

2. **Entries Needing Review**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/cash-flow-management/entries/needs-review?page=1&limit=1"
```
Monitor: Total count in pagination

3. **Reconciliation Variance**
```bash
# Run daily/weekly
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/cash-flow-management/reconciliation?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD"
```
Monitor: `variance` should be near 0, `isReconciled` should be true

### Database Indexes
Verify indexes are created:
```bash
mongo rayerp --eval "db.ledgers.getIndexes()"
```

Should see:
- `{ needsReview: 1, date: -1 }`
- `{ cashFlowCategory: 1, date: 1 }`
- `{ accountId: 1, date: 1 }`

---

## 🔒 Security Checklist

- [x] All endpoints protected with `protect` middleware
- [x] Input validation on all routes
- [x] SQL injection prevention (Mongoose)
- [x] XSS prevention (input sanitization)
- [x] Rate limiting (add if needed)
- [x] Audit trail for all changes
- [x] User authentication required
- [x] Database transactions for data integrity

---

## 📝 User Training

### For Accountants

1. **Review Workflow**
   - Access: `/api/cash-flow-management/entries/needs-review`
   - Review entries with low confidence
   - Override incorrect categorizations
   - Provide clear reasons for changes

2. **Create Rules**
   - Identify patterns in corrections
   - Create rules for recurring transactions
   - Set appropriate priorities
   - Test rules before activating

3. **Monthly Close**
   - Generate cash flow report
   - Run reconciliation
   - Investigate variances
   - Review statistics

### For Developers

1. **When creating transactions**
   - Use descriptive descriptions
   - Set appropriate `sourceType`
   - Let auto-categorization work
   - Review confidence scores

2. **Monitoring**
   - Check logs for errors
   - Monitor categorization accuracy
   - Review reconciliation reports
   - Update rules as needed

---

## 🐛 Troubleshooting

### Issue: High variance in reconciliation
**Solution**: 
1. Check for uncategorized entries
2. Verify cash account configuration
3. Review manual overrides
4. Check for duplicate entries

### Issue: Low categorization confidence
**Solution**:
1. Create more specific rules
2. Improve transaction descriptions
3. Set sourceType correctly
4. Review and correct patterns

### Issue: Performance issues
**Solution**:
1. Verify indexes are created
2. Add pagination to large queries
3. Use `.lean()` for read-only queries
4. Consider caching for reports

---

## 📞 Support

### Logs Location
- Application: `backend/logs/app.log`
- Error: `backend/logs/error.log`

### Common Log Messages
- `Category overridden for ledger X` - Manual override
- `Cash flow rule created: X` - New rule added
- `Batch updated X entries` - Bulk correction
- `Cash flow reconciliation: variance=X` - Reconciliation result

---

## ✅ Post-Deployment Verification

- [ ] Migration completed successfully
- [ ] All tests passing
- [ ] Indexes created
- [ ] API endpoints responding
- [ ] Reconciliation shows low variance
- [ ] Statistics dashboard accessible
- [ ] Logs showing no errors
- [ ] Users trained
- [ ] Documentation updated
- [ ] Backup created

---

## 🎉 Success Criteria

✅ **System is production-ready when:**
- Categorization accuracy > 85%
- Reconciliation variance < $1
- All entries categorized
- Rules engine working
- Audit trail complete
- No critical errors in logs
- Users trained and confident

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Verified By**: _____________
**Sign-off**: _____________
