# Balance Sheet - 5 Minute Quick Start

## Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
setup-balance-sheet.bat
```

## Option 2: Manual Setup

### Step 1: Install Dependencies (2 minutes)
```bash
cd backend
npm install pdfkit nodemailer node-cron
npm install --save-dev @types/pdfkit @types/nodemailer @types/node-cron
```

### Step 2: Configure Email (1 minute)
Add to `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 3: Add Routes (1 minute)
Add to `backend/src/server.ts` (after MongoDB connection):
```typescript
import { initializeScheduler } from './utils/scheduler';
import balanceSheetRoutes from './routes/balanceSheetRoutes';

initializeScheduler();
app.use('/api/finance/balance-sheet', balanceSheetRoutes);
```

### Step 4: Build with Skip Check (1 minute)
```bash
cd backend
npx tsc --skipLibCheck
```

### Step 5: Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 6: Test
Visit: `http://localhost:3000/dashboard/finance/balance-sheet`

## ✅ Verification Checklist

- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Balance sheet page loads
- [ ] Can add notes to accounts
- [ ] Can schedule reports
- [ ] PDF export works
- [ ] AI insights display
- [ ] ROE/ROA show up
- [ ] Mobile responsive works

## 🚨 Troubleshooting

### Build Errors?
```bash
npx tsc --skipLibCheck
```

### Email Not Working?
Check Gmail App Password setup:
1. Google Account > Security
2. 2-Step Verification > App passwords
3. Generate new password
4. Use in SMTP_PASS

### Routes Not Found?
Make sure you added the routes to server.ts

### Scheduler Not Running?
Make sure initializeScheduler() is called in server.ts

## 📞 Support

If issues persist, check:
- `PRODUCTION_READINESS_CHECKLIST.md` - Detailed checklist
- `BALANCE_SHEET_PHASE2_COMPLETE.md` - Full documentation
- `BALANCE_SHEET_SETUP.md` - Setup guide

## 🎉 Success!

Once everything works, you have:
- ✅ 30 features (Phase 1 + Phase 2)
- ✅ AI-powered insights
- ✅ Email scheduling
- ✅ PDF generation
- ✅ Notes to accounts
- ✅ ROE/ROA calculations
- ✅ Mobile responsive
- ✅ Production ready!
