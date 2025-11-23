# Currency Configuration - RayERP

## Default Currency: INR (₹)

The application is now configured with **Indian Rupee (INR)** as the default currency throughout the system.

## Configuration Files

### 1. **App Configuration** (`src/config/app.config.ts`)
```typescript
currency: {
  default: 'INR',
  symbol: '₹',
  locale: 'en-IN',
}
```

### 2. **Currency Config** (`src/config/currency.config.ts`)
- Centralized currency configuration
- Default: INR (₹)
- Supports multiple currencies with conversion option

### 3. **Currency Utilities** (`src/utils/currency.ts`)
- `formatCurrency()` - Format amounts with INR by default
- `getCurrencySymbol()` - Get currency symbol (₹ by default)
- `DEFAULT_CURRENCY` - 'INR'
- `DEFAULT_CURRENCY_SYMBOL` - '₹'

## Multi-Currency Support

The system supports 23 currencies across multiple regions:

### Asia & Oceania
- **INR** (₹) - Indian Rupee (Default)
- **JPY** (¥) - Japanese Yen
- **AUD** (A$) - Australian Dollar

### Americas
- **USD** ($) - US Dollar
- **CAD** (C$) - Canadian Dollar

### Europe
- **EUR** (€) - Euro
- **GBP** (£) - British Pound
- **CHF** - Swiss Franc

### Middle East (15 Currencies)
- **AED** (د.إ) - UAE Dirham
- **SAR** (ر.س) - Saudi Riyal
- **QAR** (ر.ق) - Qatari Riyal
- **KWD** (د.ك) - Kuwaiti Dinar
- **BHD** (د.ب) - Bahraini Dinar
- **OMR** (ر.ع) - Omani Rial
- **JOD** (د.ا) - Jordanian Dinar
- **ILS** (₪) - Israeli Shekel
- **LBP** (ل.ل) - Lebanese Pound
- **EGP** (ج.م) - Egyptian Pound
- **IQD** (ع.د) - Iraqi Dinar
- **SYP** (ل.س) - Syrian Pound
- **YER** (ر.ي) - Yemeni Rial
- **TRY** (₺) - Turkish Lira
- **IRR** (﷼) - Iranian Rial

## Currency Converter

Location: `src/components/budget/CurrencyConverter.tsx`
- Default from/to currency: INR
- Real-time conversion between currencies
- Exchange rates configurable
- Users can switch currencies as needed

## Usage in Components

### Import and Use
```typescript
import { formatCurrency, getCurrencySymbol, getUserPreferredCurrency } from '@/utils/currency';

// Format with user's preferred currency (from settings)
const formatted = formatCurrency(1000); // ₹1,000.00 or $1,000.00 based on user preference

// Format with specific currency (override user preference)
const usdFormatted = formatCurrency(1000, 'USD'); // $1,000.00

// Get user's preferred symbol
const symbol = getCurrencySymbol(); // ₹ or $ based on user preference

// Get user's preferred currency code
const userCurrency = getUserPreferredCurrency(); // 'INR' or 'USD' etc.
```

## Where Currency is Used

1. **Budgets** - All budget amounts display in INR by default
2. **Finance Module** - Accounting, ledgers, reports use INR
3. **Projects** - Project budgets and costs in INR
4. **Invoices** - Invoice amounts in INR
5. **Payments** - Payment tracking in INR
6. **Reports** - All financial reports default to INR

## Changing Currency

Users can change currency in:
1. **Settings > Currency** - Set global currency preference (⌘6)
2. **Currency Converter** - Convert between any supported currencies
3. **Multi-Currency Module** - Manage transactions in different currencies

## Benefits

✅ **Default INR** - All amounts show in Indian Rupee by default
✅ **Flexible** - Users can still work with other currencies when needed
✅ **Consistent** - Centralized configuration ensures consistency
✅ **Localized** - Proper formatting for Indian locale (en-IN)
✅ **Convertible** - Easy conversion between currencies

---

**Note**: The default currency is set to INR but the system maintains full multi-currency support for international operations.
