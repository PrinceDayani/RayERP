# Currency Quick Reference Guide

## Current Currency Configuration

### Default Currency: INR (₹)

## Usage in Code

### Frontend

#### Formatting Currency
```typescript
import { formatCurrency } from '@/utils/formatters';

// Default (INR)
const formatted = formatCurrency(1000); // ₹1,000.00

// Specific currency
const formattedUSD = formatCurrency(1000, 'USD'); // $1,000.00
```

#### Currency Converter
```typescript
// Base currency is INR
const currencies = [
  { code: "INR", symbol: "₹", exchangeRate: 1 },
  { code: "USD", symbol: "$", exchangeRate: 83.12 },
  { code: "EUR", symbol: "€", exchangeRate: 90.45 },
  { code: "GBP", symbol: "£", exchangeRate: 105.23 }
];
```

### Backend

#### Budget Model
```typescript
// Default currency in schema
currency: { type: String, default: 'INR' }
```

#### Formatting in Models
```typescript
// Virtual field example
virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});
```

## Exchange Rates (INR Base)

| Currency | Code | Symbol | Rate (INR) |
|----------|------|--------|------------|
| Indian Rupee | INR | ₹ | 1.00 |
| US Dollar | USD | $ | 83.12 |
| Euro | EUR | € | 90.45 |
| British Pound | GBP | £ | 105.23 |
| Japanese Yen | JPY | ¥ | 0.56 |
| Canadian Dollar | CAD | C$ | 61.34 |
| Australian Dollar | AUD | A$ | 54.78 |
| Swiss Franc | CHF | CHF | 95.67 |

## Number Formatting

### Indian Numbering System
```typescript
// Uses lakhs and crores
1,00,000 = 1 lakh
1,00,00,000 = 1 crore

// Example
const amount = 1500000;
formatCurrency(amount); // ₹15,00,000.00
```

## Common Patterns

### Display Currency in UI
```tsx
<div>
  <span>{budget.currency}</span>
  <span>{budget.totalBudget.toLocaleString()}</span>
</div>
// Output: INR 15,00,000
```

### Currency Symbol
```tsx
const getCurrencySymbol = (code: string) => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  return symbols[code] || code;
};
```

## API Responses

### Budget Response
```json
{
  "totalBudget": 150000,
  "currency": "INR",
  "formattedAmount": "₹1,50,000.00"
}
```

### Payment Response
```json
{
  "amount": 50000,
  "formattedAmount": "₹50,000.00"
}
```

## Migration from USD

### Converting Amounts
```typescript
// Approximate conversion rate
const USD_TO_INR = 83.12;

// Convert USD to INR
const inrAmount = usdAmount * USD_TO_INR;

// Example
const usdBudget = 1000; // $1,000
const inrBudget = usdBudget * 83.12; // ₹83,120
```

## Best Practices

1. **Always use formatCurrency utility** for displaying amounts
2. **Store amounts as numbers** in database (not formatted strings)
3. **Use currency field** to track which currency an amount is in
4. **Update exchange rates** periodically for accuracy
5. **Handle currency conversion** explicitly when needed

## Configuration Files

### Frontend
- `frontend/src/utils/formatters.ts` - Currency formatting
- `frontend/src/components/budget/CurrencyConverter.tsx` - Exchange rates
- `frontend/src/components/budget/BudgetDialog.tsx` - Budget currency

### Backend
- `backend/src/models/Budget.ts` - Budget currency default
- `backend/src/models/AdminSettings.ts` - System currency default
- `backend/src/models/Payment.ts` - Payment formatting
- `backend/src/models/Expense.ts` - Expense formatting

## Troubleshooting

### Issue: Currency showing as USD
**Solution**: Check if the record was created before the currency change. Update the currency field to 'INR'.

### Issue: Wrong exchange rate
**Solution**: Update exchange rates in `CurrencyConverter.tsx` and `BudgetDialog.tsx`.

### Issue: Incorrect number formatting
**Solution**: Ensure locale is set to 'en-IN' for Indian numbering system.

---

**Last Updated**: 2025
**Default Currency**: INR (₹)
