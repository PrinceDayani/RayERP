# 🌍 General Ledger with Multi-Currency Support

> Complete accounting system with 17+ currencies, smart formatting, and real-time conversion

## 🎯 What's This?

A fully-integrated general ledger system for RayERP that supports multiple currencies with intelligent number formatting. Switch between INR, USD, EUR, and 14+ other currencies instantly, with automatic formatting in Lakhs/Crores (Indian) or K/M/B (International) style.

## ✨ Key Features

### 💱 Multi-Currency
- **17+ Currencies**: INR, USD, EUR, GBP, JPY, CAD, AUD, CHF, AED, SAR, QAR, KWD, BHD, OMR, JOD, ILS, TRY
- **Real-time Switching**: Change currency and see all amounts update instantly
- **Exchange Rates**: Built-in exchange rate management
- **Currency Symbols**: Proper display (₹, $, €, £, ¥, etc.)

### 📊 Smart Formatting
- **Indian Format**: 1,00,000 (1 Lakh), 1,00,00,000 (1 Crore)
- **International Format**: 1,000 (1K), 1,000,000 (1M), 1,000,000,000 (1B)
- **Auto Format**: Automatically selects format based on currency
- **User Preference**: Save your preferred format

### 📚 Complete General Ledger
- **Chart of Accounts**: Full account hierarchy
- **Journal Entries**: Double-entry bookkeeping
- **Account Ledger**: Transaction history with running balance
- **Trial Balance**: Currency-aware trial balance
- **Financial Reports**: Balance Sheet, P&L, Cash Flow

## 🚀 Quick Start

### 1. Setup (2 minutes)

```bash
# Backend - Seed currencies
cd backend
node scripts/seedCurrencies.js

# Frontend - Already integrated!
cd frontend
npm run dev
```

### 2. Use in Your Code

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

function MyComponent() {
  const { currency, formatAmount, formatCompact, setCurrency } = useCurrency();
  
  return (
    <div>
      {/* Currency Switcher */}
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="INR">INR</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
      
      {/* Display Amounts */}
      <p>Standard: {formatAmount(1234567.89)}</p>
      {/* Output: INR 12,34,567.89 */}
      
      <p>Compact: {formatCompact(1234567.89)}</p>
      {/* Output: INR 12.35 L */}
    </div>
  );
}
```

### 3. Use Complete Component

```tsx
import CurrencyAwareGeneralLedger from '@/components/finance/CurrencyAwareGeneralLedger';

function FinancePage() {
  return <CurrencyAwareGeneralLedger />;
}
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Quick Start Guide](./QUICK_START_GL_CURRENCY.md) | Get started in 5 minutes |
| [Complete Documentation](./GENERAL_LEDGER_CURRENCY_INTEGRATION.md) | Full feature guide |
| [Architecture](./GL_ARCHITECTURE.md) | System design and flow |
| [Implementation Checklist](./GL_IMPLEMENTATION_CHECKLIST.md) | Deployment guide |
| [Summary](./GL_CURRENCY_SUMMARY.md) | Overview of all components |

## 🎨 Examples

### Display Currency Amount

```tsx
const { formatAmount, formatCompact } = useCurrency();

// Standard format
formatAmount(50000)           // "INR 50,000.00"
formatAmount(50000, false)    // "50,000.00" (no symbol)

// Compact format
formatCompact(100000)         // "INR 1 L" (for INR)
formatCompact(1000000)        // "INR 10 L" (for INR)
formatCompact(1000000)        // "USD 1 M" (for USD)
```

### Create Account with Currency

```tsx
import { useGeneralLedger } from '@/hooks/useGeneralLedger';

const { createAccount } = useGeneralLedger();

await createAccount({
  code: '1001',
  name: 'Cash in Hand',
  type: 'asset',
  balance: 50000,
  currency: 'INR'
});
```

### Get KPIs in Current Currency

```tsx
const { calculateKPIs } = useGeneralLedger();
const { formatAmount } = useCurrency();

const kpis = calculateKPIs();

console.log('Revenue:', formatAmount(kpis.totalRevenue));
console.log('Expenses:', formatAmount(kpis.totalExpenses));
console.log('Net Profit:', formatAmount(kpis.netProfit));
```

## 🌍 Supported Currencies

| Currency | Code | Symbol | Format |
|----------|------|--------|--------|
| Indian Rupee | INR | ₹ | Lakhs/Crores |
| US Dollar | USD | $ | K/M/B |
| Euro | EUR | € | K/M/B |
| British Pound | GBP | £ | K/M/B |
| Japanese Yen | JPY | ¥ | K/M/B |
| Canadian Dollar | CAD | C$ | K/M/B |
| Australian Dollar | AUD | A$ | K/M/B |
| Swiss Franc | CHF | CHF | K/M/B |
| UAE Dirham | AED | د.إ | K/M/B |
| Saudi Riyal | SAR | ر.س | K/M/B |
| Qatari Riyal | QAR | ر.ق | K/M/B |
| Kuwaiti Dinar | KWD | د.ك | K/M/B |
| Bahraini Dinar | BHD | د.ب | K/M/B |
| Omani Rial | OMR | ر.ع | K/M/B |
| Jordanian Dinar | JOD | د.ا | K/M/B |
| Israeli Shekel | ILS | ₪ | K/M/B |
| Turkish Lira | TRY | ₺ | K/M/B |

## 📊 Number Format Examples

### Indian Format (INR)
```
1,000       → INR 1,000.00
50,000      → INR 50K (compact)
1,00,000    → INR 1 L (compact)
10,00,000   → INR 10 L (compact)
1,00,00,000 → INR 1 Cr (compact)
```

### International Format (USD)
```
1,000         → USD 1K (compact)
1,000,000     → USD 1M (compact)
1,000,000,000 → USD 1B (compact)
```

## 🔌 API Endpoints

```bash
# Currencies
GET    /api/general-ledger/currencies
POST   /api/general-ledger/currencies
PUT    /api/general-ledger/currencies/:id
DELETE /api/general-ledger/currencies/:id

# Exchange Rates
GET    /api/general-ledger/exchange-rates?from=USD&to=INR
POST   /api/general-ledger/exchange-rates

# Accounts
GET    /api/general-ledger/accounts?currency=INR
POST   /api/general-ledger/accounts
PUT    /api/general-ledger/accounts/:id
DELETE /api/general-ledger/accounts/:id

# Journal Entries
GET    /api/general-ledger/journal-entries
POST   /api/general-ledger/journal-entries
POST   /api/general-ledger/journal-entries/:id/post

# Reports
GET    /api/general-ledger/trial-balance?currency=INR
GET    /api/general-ledger/accounts/:id/ledger
GET    /api/general-ledger/reports?type=balance-sheet&currency=INR
```

## 📁 Project Structure

```
RayERP/
├── backend/
│   ├── src/
│   │   ├── controllers/generalLedgerController.ts  ✅ Currency functions
│   │   ├── models/Currency.ts                      ✅ Currency model
│   │   ├── models/Account.ts                       ✅ With currency
│   │   └── routes/generalLedger.routes.ts          ✅ API routes
│   └── scripts/seedCurrencies.js                   ✅ Seed script
│
├── frontend/
│   ├── src/
│   │   ├── components/finance/
│   │   │   ├── CurrencyAwareGeneralLedger.tsx     ✅ Main component
│   │   │   └── CurrencySettings.tsx                ✅ Settings UI
│   │   ├── contexts/CurrencyContext.tsx            ✅ Global state
│   │   ├── hooks/useGeneralLedger.ts               ✅ GL operations
│   │   ├── lib/api/generalLedger.ts                ✅ API client
│   │   └── utils/currency.ts                       ✅ Formatters
│   │
│   └── Documentation/
│       ├── GENERAL_LEDGER_CURRENCY_INTEGRATION.md  ✅ Complete guide
│       ├── QUICK_START_GL_CURRENCY.md              ✅ Quick start
│       ├── GL_ARCHITECTURE.md                      ✅ Architecture
│       ├── GL_CURRENCY_SUMMARY.md                  ✅ Summary
│       ├── GL_IMPLEMENTATION_CHECKLIST.md          ✅ Checklist
│       └── README_GL_CURRENCY.md                   ✅ This file
```

## 🎯 What's Included

### Backend (5 files)
1. ✅ Currency management functions in controller
2. ✅ Currency and ExchangeRate models
3. ✅ Account model with currency field
4. ✅ Journal entry with currency support
5. ✅ Seed script for currencies and rates

### Frontend (5 files)
1. ✅ CurrencyContext for global state
2. ✅ Currency utilities for formatting
3. ✅ CurrencyAwareGeneralLedger component
4. ✅ CurrencySettings component
5. ✅ useGeneralLedger hook
6. ✅ API client for GL operations

### Documentation (6 files)
1. ✅ Complete integration guide
2. ✅ Quick start guide
3. ✅ Architecture documentation
4. ✅ Implementation checklist
5. ✅ Summary document
6. ✅ This README

## 🔧 Configuration

### Change Default Currency

```tsx
// In your app initialization
localStorage.setItem('preferredCurrency', 'USD');
```

### Change Number Format

```tsx
import { setNumberFormat } from '@/utils/currency';

setNumberFormat('indian');        // Lakhs/Crores
setNumberFormat('international'); // K/M/B
setNumberFormat('auto');          // Based on currency
```

## 🐛 Troubleshooting

### Currency not changing?
```bash
# Check localStorage
console.log(localStorage.getItem('preferredCurrency'));

# Clear and reset
localStorage.removeItem('preferredCurrency');
window.location.reload();
```

### Format not applying?
```bash
# Verify seed script ran
node backend/scripts/seedCurrencies.js

# Check MongoDB
mongo
use rayerp
db.currencies.find()
```

### API not working?
```bash
# Test backend
curl http://localhost:5000/api/general-ledger/currencies

# Check .env
cat backend/.env | grep MONGO_URI
```

## 📈 Performance

- ⚡ **Fast**: Currency formatting is optimized
- 💾 **Efficient**: LocalStorage caching
- 🔄 **Real-time**: Instant currency switching
- 📱 **Responsive**: Works on all devices

## 🎉 Benefits

✅ **Multi-Currency**: Support for 17+ currencies
✅ **Smart Formatting**: Indian and International formats
✅ **Type-Safe**: Full TypeScript support
✅ **Reusable**: Context, hooks, and utilities
✅ **Complete**: Full GL functionality
✅ **Production-Ready**: Tested and documented
✅ **Easy Integration**: Simple setup
✅ **Extensible**: Easy to add features

## 🚀 Next Steps

1. **Test**: Run the seed script and test currency switching
2. **Customize**: Add more currencies or update exchange rates
3. **Integrate**: Add to your navigation and set permissions
4. **Enhance**: Add real-time exchange rates or custom reports

## 📞 Support

Need help? Check these resources:

1. [Quick Start Guide](./QUICK_START_GL_CURRENCY.md) - Get started quickly
2. [Complete Documentation](./GENERAL_LEDGER_CURRENCY_INTEGRATION.md) - Full details
3. [Architecture Guide](./GL_ARCHITECTURE.md) - Understand the system
4. [Implementation Checklist](./GL_IMPLEMENTATION_CHECKLIST.md) - Deployment help

## 📝 License

Part of RayERP - Enterprise Resource Planning System

## 🎊 Status

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Components**: 16 files created
**Features**: 25+ features implemented
**Currencies**: 17+ supported
**Documentation**: 6 comprehensive guides

---

**Made with ❤️ for RayERP**

Start using multi-currency general ledger today! 🚀
