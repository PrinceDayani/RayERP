# 🚀 Finance Module - Installation & Setup Guide

## Prerequisites
- Node.js v18+
- MongoDB running
- Git

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install pdfkit @types/pdfkit
```

### 2. Verify Routes
The financial report routes are already configured in `src/routes/index.ts`:
```typescript
router.use('/financial-reports', financialReportRoutes);
```

### 3. Restart Backend
```bash
npm run dev
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install recharts
```

### 2. Verify Pages Created
Check these files exist:
- `src/app/dashboard/finance/invoices/page.tsx`
- `src/app/dashboard/finance/payments/page.tsx`
- `src/app/dashboard/finance/reports-enhanced/page.tsx`

### 3. Restart Frontend
```bash
npm run dev
```

## Testing

### 1. Test Invoice Management
```
Navigate to: http://localhost:3000/dashboard/finance/invoices
- Click "New Invoice"
- Fill form and submit
- Verify invoice appears in list
```

### 2. Test Payment Processing
```
Navigate to: http://localhost:3000/dashboard/finance/payments
- Click "Record Payment"
- Fill form and submit
- Verify payment appears in list
```

### 3. Test Enhanced Reports
```
Navigate to: http://localhost:3000/dashboard/finance/reports-enhanced
- Select report type
- Choose date range
- Click "Generate"
- Test CSV export
- Test PDF export
```

### 4. Test API Endpoints
```bash
# Profit & Loss
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31"

# Balance Sheet
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/financial-reports/balance-sheet?asOfDate=2024-12-31"

# Cash Flow
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/financial-reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31"

# Export CSV
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/financial-reports/export?reportType=profit-loss&format=csv" \
  --output report.csv

# Export PDF
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/financial-reports/export?reportType=balance-sheet&format=pdf" \
  --output report.pdf
```

## Navigation Setup

Add these links to your finance dashboard navigation:

```typescript
// In your finance navigation component
const financeLinks = [
  { name: 'Dashboard', href: '/dashboard/finance' },
  { name: 'Invoices', href: '/dashboard/finance/invoices' },
  { name: 'Payments', href: '/dashboard/finance/payments' },
  { name: 'Reports', href: '/dashboard/finance/reports-enhanced' },
  { name: 'Journal Entry', href: '/dashboard/finance/journal-entry' },
  { name: 'Accounts', href: '/dashboard/finance/account-ledger' }
];
```

## Troubleshooting

### Issue: PDF Export Not Working
```bash
# Reinstall pdfkit
cd backend
npm uninstall pdfkit
npm install pdfkit @types/pdfkit
```

### Issue: Charts Not Displaying
```bash
# Reinstall recharts
cd frontend
npm uninstall recharts
npm install recharts
```

### Issue: 404 on Routes
- Verify routes are registered in `backend/src/routes/index.ts`
- Check server logs for errors
- Restart backend server

### Issue: Authentication Errors
- Verify token is stored in localStorage
- Check token expiration
- Re-login if needed

## Features Summary

### ✅ Completed
- Invoice Management UI
- Payment Processing UI
- Enhanced Reports with Export
- Cash Flow Statement
- PDF Export
- CSV Export
- Comparative Reports API

### 📊 Available Reports
1. Profit & Loss Statement
2. Balance Sheet
3. Cash Flow Statement
4. Comparative Analysis

### 📤 Export Formats
- CSV (Excel compatible)
- PDF (Printable)
- JSON (API)

## Next Steps

1. **Customize PDF Templates**
   - Edit `backend/src/controllers/financialReportController.ts`
   - Modify PDF generation logic

2. **Add More Charts**
   - Install chart.js: `npm install chart.js react-chartjs-2`
   - Add to reports-enhanced page

3. **Email Reports**
   - Install nodemailer: `npm install nodemailer`
   - Create email service

4. **Scheduled Reports**
   - Install node-cron: `npm install node-cron`
   - Create scheduled jobs

## Support

For issues or questions:
1. Check documentation in `FINANCE_UI_ENHANCEMENTS.md`
2. Review API documentation
3. Check server logs
4. Verify database connection

---

**Status:** Ready for Production ✅  
**Version:** 1.0  
**Last Updated:** January 2025
