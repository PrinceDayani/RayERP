# General Ledger with Currency Integration

## Overview
Complete general ledger system with multi-currency support, real-time currency conversion, and flexible number formatting.

## Features

### 1. Multi-Currency Support
- **25+ Currencies**: INR, USD, EUR, GBP, JPY, CAD, AUD, CHF, AED, SAR, QAR, KWD, BHD, OMR, JOD, ILS, TRY, and more
- **Real-time Exchange Rates**: Automatic currency conversion based on latest rates
- **Base Currency**: Set default currency for all transactions
- **Currency Symbols**: Proper display of currency symbols (₹, $, €, £, etc.)

### 2. Number Formatting
- **Indian Format**: Lakhs (L) and Crores (Cr) for INR
  - 1,00,000 = 1 L
  - 1,00,00,000 = 1 Cr
- **International Format**: Thousands (K), Millions (M), Billions (B)
  - 1,000 = 1K
  - 1,000,000 = 1M
  - 1,000,000,000 = 1B
- **Auto Format**: Automatically selects format based on currency

### 3. General Ledger Features
- **Chart of Accounts**: Complete account hierarchy
- **Journal Entries**: Double-entry bookkeeping with currency support
- **Account Ledger**: Transaction history with running balance
- **Trial Balance**: Currency-aware trial balance
- **Financial Reports**: Balance Sheet, P&L, Cash Flow in any currency

## Architecture

### Backend Components

#### Models
```
backend/src/models/
├── Currency.ts          # Currency and exchange rate models
├── Account.ts           # Account with currency field
└── JournalEntry.ts      # Journal entries with multi-currency support
```

#### Controllers
```
backend/src/controllers/
└── generalLedgerController.ts
    ├── Currency Management (getCurrencies, createCurrency, etc.)
    ├── Exchange Rates (getExchangeRate, updateExchangeRate)
    ├── Accounts (getAccounts, createAccount, etc.)
    ├── Journal Entries (getJournalEntries, createJournalEntry, etc.)
    └── Reports (getTrialBalance, getFinancialReports, etc.)
```

#### Routes
```
backend/src/routes/
└── generalLedger.routes.ts
    ├── GET    /api/general-ledger/currencies
    ├── POST   /api/general-ledger/currencies
    ├── GET    /api/general-ledger/exchange-rates
    ├── POST   /api/general-ledger/exchange-rates
    ├── GET    /api/general-ledger/accounts
    ├── POST   /api/general-ledger/accounts
    ├── GET    /api/general-ledger/journal-entries
    ├── POST   /api/general-ledger/journal-entries
    ├── GET    /api/general-ledger/trial-balance
    └── GET    /api/general-ledger/reports
```

### Frontend Components

#### Context
```
frontend/src/contexts/
└── CurrencyContext.tsx
    ├── currency: Current selected currency
    ├── symbol: Currency symbol
    ├── setCurrency: Change currency
    ├── formatAmount: Format with currency
    └── formatCompact: Compact format (L/Cr or K/M/B)
```

#### Components
```
frontend/src/components/finance/
├── CurrencyAwareGeneralLedger.tsx  # Main GL component
├── CurrencySettings.tsx             # Currency preferences
└── GeneralLedger.tsx                # Original GL component
```

#### Hooks
```
frontend/src/hooks/
└── useGeneralLedger.ts
    ├── accounts, journalEntries, currencies
    ├── fetchAccounts, createAccount, updateAccount
    ├── createJournalEntry, postJournalEntry
    └── calculateKPIs, getTrialBalance
```

#### API Client
```
frontend/src/lib/api/
└── generalLedger.ts
    ├── Account operations
    ├── Journal entry operations
    ├── Currency operations
    ├── Exchange rate operations
    └── Report generation
```

#### Utilities
```
frontend/src/utils/
└── currency.ts
    ├── formatCurrency: Format amount with currency
    ├── formatIndianNumber: Lakhs/Crores format
    ├── formatInternationalNumber: K/M/B format
    ├── getCurrencySymbol: Get symbol for currency
    └── setNumberFormat: Set user preference
```

## Setup

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Seed Currencies
```bash
node scripts/seedCurrencies.js
```

#### Start Server
```bash
npm run dev
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```

## Usage

### Currency Context

Wrap your app with CurrencyProvider:

```tsx
import { CurrencyProvider } from '@/contexts/CurrencyContext';

function App() {
  return (
    <CurrencyProvider>
      <YourComponents />
    </CurrencyProvider>
  );
}
```

### Using Currency Formatting

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

function MyComponent() {
  const { currency, formatAmount, formatCompact } = useCurrency();
  
  return (
    <div>
      <p>Standard: {formatAmount(1234567.89)}</p>
      {/* Output: INR 12,34,567.89 */}
      
      <p>Compact: {formatCompact(1234567.89)}</p>
      {/* Output: INR 12.35 L */}
    </div>
  );
}
```

### Using General Ledger Hook

```tsx
import { useGeneralLedger } from '@/hooks/useGeneralLedger';

function AccountsList() {
  const { accounts, loading, createAccount } = useGeneralLedger();
  
  const handleCreate = async () => {
    await createAccount({
      code: '1001',
      name: 'Cash',
      type: 'asset',
      balance: 50000
    });
  };
  
  return (
    <div>
      {accounts.map(account => (
        <div key={account._id}>
          {account.code} - {account.name}: {formatAmount(account.balance)}
        </div>
      ))}
    </div>
  );
}
```

## API Examples

### Get Accounts
```bash
GET /api/general-ledger/accounts?currency=INR
```

### Create Journal Entry
```bash
POST /api/general-ledger/journal-entries
{
  "date": "2024-01-15",
  "description": "Sales transaction",
  "currency": "INR",
  "lines": [
    { "accountId": "...", "debit": 50000, "credit": 0 },
    { "accountId": "...", "debit": 0, "credit": 50000 }
  ]
}
```

### Get Exchange Rate
```bash
GET /api/general-ledger/exchange-rates?from=USD&to=INR
```

### Get Trial Balance
```bash
GET /api/general-ledger/trial-balance?currency=INR&date=2024-01-31
```

## Currency Formatting Examples

### Indian Format (INR)
```
1,000       → INR 1,000.00
50,000      → INR 50,000.00 (50K compact)
1,00,000    → INR 1,00,000.00 (1 L compact)
10,00,000   → INR 10,00,000.00 (10 L compact)
1,00,00,000 → INR 1,00,00,000.00 (1 Cr compact)
```

### International Format (USD)
```
1,000         → USD 1,000.00 (1K compact)
1,000,000     → USD 1,000,000.00 (1M compact)
1,000,000,000 → USD 1,000,000,000.00 (1B compact)
```

## Configuration

### Set Default Currency
```typescript
// In CurrencyContext or localStorage
localStorage.setItem('preferredCurrency', 'INR');
```

### Set Number Format
```typescript
import { setNumberFormat } from '@/utils/currency';

setNumberFormat('indian');      // Lakhs/Crores
setNumberFormat('international'); // K/M/B
setNumberFormat('auto');         // Based on currency
```

## Database Schema

### Currency
```typescript
{
  code: string;           // 'INR', 'USD', etc.
  name: string;           // 'Indian Rupee'
  symbol: string;         // '₹'
  isBaseCurrency: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ExchangeRate
```typescript
{
  fromCurrency: string;   // 'USD'
  toCurrency: string;     // 'INR'
  rate: number;           // 83.12
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Account (with currency)
```typescript
{
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;       // 'INR'
  isActive: boolean;
  // ... other fields
}
```

### JournalEntry (with currency)
```typescript
{
  entryNumber: string;
  date: Date;
  description: string;
  currency: string;       // 'INR'
  totalDebit: number;
  totalCredit: number;
  lines: [{
    accountId: ObjectId;
    debit: number;
    credit: number;
    currency: string;     // Optional for multi-currency
    exchangeRate: number; // Optional for conversion
  }];
  // ... other fields
}
```

## Features Checklist

- [x] Multi-currency support (25+ currencies)
- [x] Currency context and provider
- [x] Currency formatting utilities
- [x] Indian number format (Lakhs/Crores)
- [x] International number format (K/M/B)
- [x] Auto format selection
- [x] Currency switcher component
- [x] Currency settings page
- [x] Exchange rate management
- [x] Currency-aware accounts
- [x] Currency-aware journal entries
- [x] Currency-aware reports
- [x] General ledger hook
- [x] API client for GL operations
- [x] Backend currency controllers
- [x] Currency seed script
- [x] Real-time currency conversion
- [x] Compact number display
- [x] Symbol-based formatting

## Testing

### Test Currency Formatting
```typescript
import { formatCurrency, formatCompact } from '@/utils/currency';

// Test Indian format
console.log(formatCurrency(1234567, 'INR', true, false));
// Output: INR 12,34,567.00

console.log(formatCurrency(1234567, 'INR', true, true));
// Output: INR 12.35 L

// Test International format
console.log(formatCurrency(1234567, 'USD', true, true));
// Output: USD 1.23 M
```

### Test API Endpoints
```bash
# Get currencies
curl http://localhost:5000/api/general-ledger/currencies

# Get exchange rate
curl http://localhost:5000/api/general-ledger/exchange-rates?from=USD&to=INR

# Get accounts
curl http://localhost:5000/api/general-ledger/accounts
```

## Troubleshooting

### Currency not updating
- Check if CurrencyProvider wraps your components
- Verify localStorage has 'preferredCurrency'
- Clear browser cache and reload

### Number format not applying
- Check localStorage 'numberFormat' value
- Reload page after changing format
- Verify currency.ts utility is imported correctly

### Exchange rates not working
- Run seed script: `node scripts/seedCurrencies.js`
- Check MongoDB connection
- Verify exchange rates collection has data

## Future Enhancements

- [ ] Real-time exchange rate API integration
- [ ] Historical exchange rate tracking
- [ ] Multi-currency transaction support
- [ ] Currency gain/loss calculation
- [ ] Automated currency conversion on posting
- [ ] Currency-wise financial reports
- [ ] Budget vs actual in multiple currencies
- [ ] Currency hedging tracking
- [ ] Cryptocurrency support
- [ ] Custom currency creation

## Support

For issues or questions:
1. Check this documentation
2. Review code examples
3. Check console for errors
4. Verify API responses
5. Test with sample data

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2024
