# Quick Start: General Ledger with Currency Integration

## 🚀 5-Minute Setup

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Seed currencies and exchange rates
node scripts/seedCurrencies.js
```

Expected output:
```
Connected to MongoDB
Cleared existing currencies and exchange rates
Inserted 17 currencies
Inserted 20 exchange rates
Currency seeding completed successfully!
```

### Step 2: Frontend Integration (3 minutes)

#### Add to your main layout or app file:

```tsx
// app/layout.tsx or app/providers.tsx
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
```

#### Use in any component:

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

function MyComponent() {
  const { currency, formatAmount, formatCompact, setCurrency } = useCurrency();
  
  return (
    <div>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="INR">INR</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
      
      <p>Amount: {formatAmount(1234567.89)}</p>
      <p>Compact: {formatCompact(1234567.89)}</p>
    </div>
  );
}
```

## 📊 Using the General Ledger

### Option 1: Use the Complete Component

```tsx
import CurrencyAwareGeneralLedger from '@/components/finance/CurrencyAwareGeneralLedger';

function FinancePage() {
  return <CurrencyAwareGeneralLedger />;
}
```

### Option 2: Use the Hook

```tsx
import { useGeneralLedger } from '@/hooks/useGeneralLedger';
import { useCurrency } from '@/contexts/CurrencyContext';

function CustomGL() {
  const { accounts, loading, createAccount } = useGeneralLedger();
  const { formatAmount } = useCurrency();
  
  return (
    <div>
      {accounts.map(account => (
        <div key={account._id}>
          {account.name}: {formatAmount(account.balance)}
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Common Use Cases

### 1. Display Currency Amount

```tsx
const { formatAmount } = useCurrency();

// Standard format
formatAmount(50000)           // "INR 50,000.00"

// Without symbol
formatAmount(50000, false)    // "50,000.00"

// Compact format
formatCompact(1000000)        // "INR 10 L" (for INR)
formatCompact(1000000)        // "INR 1 M" (for USD)
```

### 2. Create Account with Currency

```tsx
const { createAccount } = useGeneralLedger();

await createAccount({
  code: '1001',
  name: 'Cash in Hand',
  type: 'asset',
  balance: 50000,
  currency: 'INR'
});
```

### 3. Create Journal Entry

```tsx
const { createJournalEntry } = useGeneralLedger();

await createJournalEntry({
  date: '2024-01-15',
  description: 'Sales transaction',
  lines: [
    { accountId: cashAccountId, debit: 50000, credit: 0 },
    { accountId: salesAccountId, debit: 0, credit: 50000 }
  ]
});
```

### 4. Switch Currency

```tsx
const { currency, setCurrency } = useCurrency();

// Change to USD
setCurrency('USD');

// All amounts will automatically update
```

### 5. Get KPIs in Current Currency

```tsx
const { calculateKPIs } = useGeneralLedger();
const { formatAmount } = useCurrency();

const kpis = calculateKPIs();

console.log('Revenue:', formatAmount(kpis.totalRevenue));
console.log('Expenses:', formatAmount(kpis.totalExpenses));
console.log('Net Profit:', formatAmount(kpis.netProfit));
```

## 🔧 Configuration

### Change Default Currency

```tsx
// In your app initialization
localStorage.setItem('preferredCurrency', 'USD');
```

### Change Number Format

```tsx
import { setNumberFormat } from '@/utils/currency';

// Indian format (Lakhs/Crores)
setNumberFormat('indian');

// International format (K/M/B)
setNumberFormat('international');

// Auto (based on currency)
setNumberFormat('auto');
```

## 📱 Available Components

### 1. CurrencyAwareGeneralLedger
Complete GL with currency support
```tsx
<CurrencyAwareGeneralLedger />
```

### 2. CurrencySettings
Currency preferences UI
```tsx
<CurrencySettings />
```

### 3. GeneralLedger (Original)
Full-featured GL component
```tsx
<GeneralLedger />
```

## 🌍 Supported Currencies

| Code | Name | Symbol |
|------|------|--------|
| INR | Indian Rupee | ₹ |
| USD | US Dollar | $ |
| EUR | Euro | € |
| GBP | British Pound | £ |
| JPY | Japanese Yen | ¥ |
| CAD | Canadian Dollar | C$ |
| AUD | Australian Dollar | A$ |
| CHF | Swiss Franc | CHF |
| AED | UAE Dirham | د.إ |
| SAR | Saudi Riyal | ر.س |
| QAR | Qatari Riyal | ر.ق |
| KWD | Kuwaiti Dinar | د.ك |
| BHD | Bahraini Dinar | د.ب |
| OMR | Omani Rial | ر.ع |
| JOD | Jordanian Dinar | د.ا |
| ILS | Israeli Shekel | ₪ |
| TRY | Turkish Lira | ₺ |

## 📊 Number Format Examples

### Indian Format (INR)
```
1,000       → INR 1,000.00
50,000      → INR 50K
1,00,000    → INR 1 L
10,00,000   → INR 10 L
1,00,00,000 → INR 1 Cr
```

### International Format (USD)
```
1,000         → USD 1K
1,000,000     → USD 1M
1,000,000,000 → USD 1B
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

## ✅ Verification

Test your setup:

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

function TestComponent() {
  const { currency, formatAmount, formatCompact } = useCurrency();
  
  return (
    <div>
      <h1>Currency Test</h1>
      <p>Current: {currency}</p>
      <p>Standard: {formatAmount(1234567.89)}</p>
      <p>Compact: {formatCompact(1234567.89)}</p>
    </div>
  );
}
```

Expected output for INR:
```
Current: INR
Standard: INR 12,34,567.89
Compact: INR 12.35 L
```

## 🐛 Troubleshooting

### Currency not changing?
```tsx
// Check if provider is wrapping your app
// Verify in browser console:
console.log(localStorage.getItem('preferredCurrency'));
```

### Format not applying?
```tsx
// Clear and reset
localStorage.removeItem('numberFormat');
localStorage.removeItem('preferredCurrency');
window.location.reload();
```

### API not working?
```bash
# Check backend is running
curl http://localhost:5000/api/general-ledger/currencies

# Verify MongoDB connection
# Check .env file has MONGO_URI
```

## 🎉 You're Ready!

Your general ledger is now fully integrated with multi-currency support!

Next steps:
1. Explore the full documentation: `GENERAL_LEDGER_CURRENCY_INTEGRATION.md`
2. Customize currency list in `seedCurrencies.js`
3. Add more exchange rates as needed
4. Build custom reports with currency formatting

---

**Need Help?** Check the main documentation or review the example components.
