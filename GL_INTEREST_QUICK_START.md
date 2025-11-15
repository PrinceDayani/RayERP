# GL Budgets & Interest Calculations - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Login
Navigate to `http://localhost:3000/login` and login with your credentials.

### Step 3: Access the Modules

**GL Budgets**: `http://localhost:3000/dashboard/finance/gl-budgets`  
**Interest Calculations**: `http://localhost:3000/dashboard/finance/interest`

---

## 💰 GL Budgets - Quick Usage

### Create Your First Budget

1. Click **"Create Budget"** button
2. Select an account from dropdown
3. Enter fiscal year (e.g., 2024)
4. Choose period: Monthly, Quarterly, or Yearly
5. Enter budget amount
6. Click **"Create"**

### Revise a Budget

1. Find the budget in the list
2. Click **"Revise"** button
3. Enter new amount
4. Provide reason for revision
5. Click **"Submit Revision"**

### Monitor Alerts

- Switch to **"Alerts"** tab
- View budgets exceeding thresholds:
  - 🟡 80% utilization
  - 🟠 90% utilization
  - 🔴 100% utilization
  - ⚠️ Overspending

### Copy from Previous Year

1. Click **"Copy Previous Year"** button
2. Automatically creates budgets for current year
3. Applies 5% adjustment by default

---

## 📊 Interest Calculations - Quick Usage

### Calculate Simple Interest

1. Select **"Simple Interest"** from type dropdown
2. Choose account with balance
3. Enter interest rate (e.g., 8.5%)
4. Select date range
5. Enter TDS rate (default 10%)
6. Click **"Calculate Interest"**
7. Review calculated amount
8. Click **"Post Entry"** to save

### Calculate Compound Interest

1. Select **"Compound Interest"**
2. Choose compounding frequency:
   - Daily
   - Monthly
   - Quarterly
   - Yearly
3. Enter other details
4. Click **"Calculate Interest"**
5. View effective interest rate
6. Post when ready

### Calculate EMI

1. Select **"EMI/Loan Interest"**
2. Enter loan period in months
3. Enter interest rate
4. Click **"Calculate Interest"**
5. View complete EMI schedule
6. Track installment-wise breakdown

### Calculate Overdue Interest

1. Select **"Overdue/Penalty Interest"**
2. Enter grace period days
3. Enter penalty rate
4. Calculate overdue interest
5. Post penalty charges

### Schedule Auto-Calculation

1. Fill in calculation details
2. Click **"Schedule Auto-Calculation"**
3. System will auto-calculate monthly
4. Review scheduled calculations in history

---

## 📈 Key Features at a Glance

### GL Budgets
- ✅ Multi-period budgets (Monthly/Quarterly/Yearly)
- ✅ Budget revisions with audit trail
- ✅ Multi-level approval workflow
- ✅ Smart alerts (80%, 90%, 100%, overspending)
- ✅ YoY comparison
- ✅ Copy from previous year
- ✅ Real-time utilization tracking

### Interest Calculations
- ✅ Simple interest
- ✅ Compound interest (4 frequencies)
- ✅ EMI calculator with amortization
- ✅ Overdue/penalty interest
- ✅ TDS auto-calculation
- ✅ Daily accrual tracking
- ✅ Auto-calculation scheduler
- ✅ Complete calculation history

---

## 🎯 Common Use Cases

### Use Case 1: Annual Budget Planning
1. Create yearly budgets for all accounts
2. Set up approval workflow
3. Monitor utilization monthly
4. Revise as needed with proper documentation

### Use Case 2: Fixed Deposit Interest
1. Enable interest on FD account
2. Use compound interest calculator
3. Select monthly compounding
4. Schedule auto-calculation
5. TDS deducted automatically

### Use Case 3: Loan Management
1. Create loan account
2. Use EMI calculator
3. View amortization schedule
4. Track principal vs interest
5. Monitor outstanding balance

### Use Case 4: Overdue Payments
1. Identify overdue invoices
2. Calculate penalty interest
3. Apply grace period
4. Post penalty charges
5. Track overdue amounts

---

## 💡 Pro Tips

### GL Budgets
- Create budgets at start of fiscal year
- Use templates for consistency
- Set up alerts for proactive monitoring
- Freeze budgets after final approval
- Document all revisions clearly

### Interest Calculations
- Enable interest on relevant accounts only
- Use compound interest for long-term deposits
- Always apply TDS for taxable interest
- Schedule auto-calculations for recurring interest
- Review accruals for accurate reporting

---

## 🔍 Troubleshooting

### Budget Not Saving?
- Check if account is selected
- Verify fiscal year format
- Ensure budget amount is positive
- Check authentication token

### Interest Not Calculating?
- Verify account has balance
- Check date range is valid
- Ensure interest rate is entered
- Confirm account has enableInterest flag

### API Not Responding?
- Check backend is running on port 5000
- Verify frontend is running on port 3000
- Check browser console for errors
- Verify you're logged in

---

## 📊 Sample Data

### Sample Budget
```json
{
  "accountId": "65abc123...",
  "fiscalYear": "2024",
  "budgetAmount": 500000,
  "period": "yearly"
}
```

### Sample Interest Calculation
```json
{
  "accountId": "65abc123...",
  "calculationType": "compound",
  "fromDate": "2024-01-01",
  "toDate": "2024-12-31",
  "principalAmount": 100000,
  "interestRate": 8.5,
  "compoundingFrequency": "monthly",
  "tdsRate": 10
}
```

---

## 🎉 You're Ready!

Both modules are now fully functional and ready to use. Start creating budgets and calculating interest right away!

**Need Help?** Check the complete documentation in `GL_BUDGETS_INTEREST_COMPLETE.md`

**Connection Issues?** See `FRONTEND_BACKEND_CONNECTION_VERIFIED.md`

Happy budgeting and calculating! 🚀
