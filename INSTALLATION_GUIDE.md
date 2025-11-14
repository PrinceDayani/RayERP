# Installation Guide - World-Class Features

## 📦 Required Dependencies

### Frontend Dependencies

Install the charting library for visualizations:

```bash
cd frontend
npm install recharts
```

That's it! All other dependencies are already included.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install recharts
```

### 2. Start the Application
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### 3. Access the Features

**Balance Sheet:**
- Navigate to: `http://localhost:3000/dashboard/finance/balance-sheet`
- Features available:
  - Comparative analysis (YoY, QoQ, Custom, Multi-Period)
  - Drill-down to transactions
  - Financial ratios
  - Charts and visualizations
  - Saved views
  - Scheduled reports
  - Search & filter
  - Keyboard shortcuts
  - Print support

**Bank Reconciliation:**
- Navigate to: `http://localhost:3000/dashboard/finance/bank-reconciliation`
- Features available:
  - CSV import with column mapping
  - AI-powered auto-matching
  - Bulk operations
  - Reconciliation analytics
  - Smart notifications
  - Notes & comments
  - Search & filter
  - Keyboard shortcuts
  - Trend analysis

---

## 🔧 Configuration

### No Additional Configuration Required!

All features work out of the box. However, you can customize:

### Optional: Email Configuration (for scheduled reports)

Add to `backend/.env`:
```env
# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📊 Testing the Features

### Balance Sheet

1. **Test Comparative Analysis:**
   - Select "YoY" from compare dropdown
   - Date automatically adjusts to 1 year ago
   - View changes with green/red indicators

2. **Test Charts:**
   - Click "Charts" tab
   - View pie chart for composition
   - View bar chart for comparison

3. **Test Multi-Period Trends:**
   - Select "Multi-Period" from dropdown
   - Click "Trends" tab
   - View 5-quarter trend line

4. **Test Saved Views:**
   - Set up a custom date range
   - Click "Save View"
   - Name it and save
   - Load it later with one click

5. **Test Keyboard Shortcuts:**
   - Press `Ctrl+P` to print
   - Press `Ctrl+S` to save view
   - Press `Ctrl+E` to export CSV
   - Press `Ctrl+F` to search

### Bank Reconciliation

1. **Test CSV Import:**
   - Click "Import CSV"
   - Upload a CSV file with columns: Date, Description, Debit, Credit
   - Map columns (0=Date, 1=Description, 2=Debit, 3=Credit)
   - Preview and import

2. **Test Auto-Matching:**
   - Upload a statement
   - Click "Start Auto-Match"
   - System matches 70-80% automatically
   - View matched count in toast notification

3. **Test Bulk Operations:**
   - Select multiple unmatched transactions
   - Click "Match Selected (N)"
   - Transactions move to matched

4. **Test Analytics:**
   - Click "Analytics" tab
   - View average reconciliation time
   - View completion rate
   - View trend chart

5. **Test Keyboard Shortcuts:**
   - Press `Ctrl+P` to print
   - Press `Ctrl+M` to match selected
   - Press `Ctrl+F` to search

---

## 📝 Sample CSV Format

For testing CSV import, use this format:

```csv
Date,Description,Debit,Credit,Reference
2024-01-15,Payment received,0,5000,CHQ001
2024-01-16,Office supplies,250,0,INV123
2024-01-17,Salary payment,50000,0,SAL001
2024-01-18,Sales revenue,0,15000,INV124
2024-01-19,Rent payment,10000,0,RENT001
```

Save as `bank_statement.csv` and import.

---

## 🐛 Troubleshooting

### Charts not displaying?

**Solution:**
```bash
cd frontend
npm install recharts
npm run dev
```

### Keyboard shortcuts not working?

**Solution:**
- Make sure you're focused on the page (click anywhere)
- Use `Ctrl` on Windows/Linux or `Cmd` on Mac
- Check browser console for errors

### CSV import failing?

**Solution:**
- Ensure CSV has proper format (comma-separated)
- Check column mapping is correct
- Verify date format is valid
- Check for special characters in data

### Saved views not persisting?

**Solution:**
- Check browser localStorage is enabled
- Clear browser cache and try again
- Check browser console for errors

---

## 📚 Documentation

For detailed feature documentation, see:
- [WORLD_CLASS_FEATURES.md](WORLD_CLASS_FEATURES.md) - Complete feature list
- [BALANCE_SHEET_BANK_RECON_UPGRADE.md](BALANCE_SHEET_BANK_RECON_UPGRADE.md) - Production-ready features
- [README.md](README.md) - Main project documentation

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Start the application
3. ✅ Test Balance Sheet features
4. ✅ Test Bank Reconciliation features
5. ✅ Customize as needed
6. ✅ Deploy to production

---

## 🚀 Production Deployment

### Before deploying:

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Build the backend:**
```bash
cd backend
npm run build
```

3. **Set environment variables:**
- Set `NODE_ENV=production`
- Configure MongoDB production URI
- Set JWT secret
- Configure SMTP (if using scheduled reports)

4. **Deploy:**
- Frontend: Vercel, Netlify, or AWS S3
- Backend: Heroku, AWS EC2, or DigitalOcean
- Database: MongoDB Atlas

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Balance Sheet loads without errors
- [ ] Charts display correctly
- [ ] Comparative analysis works
- [ ] Drill-down opens transaction dialog
- [ ] Saved views persist
- [ ] Keyboard shortcuts work
- [ ] Print layout is correct
- [ ] CSV import works
- [ ] Auto-matching runs
- [ ] Bulk operations work
- [ ] Analytics display
- [ ] Search filters results
- [ ] All tabs load correctly

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Check network tab for API errors
4. Verify all dependencies are installed
5. Ensure backend is running
6. Check MongoDB connection

---

**Installation Complete! Enjoy your world-class finance modules! 🎉**
