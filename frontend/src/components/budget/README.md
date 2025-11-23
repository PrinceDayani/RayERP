# Budget Components - Currency Integration Guide

## Quick Start

### Import Currency Utilities
```tsx
import { formatCurrency, formatCurrencySmart, getCurrencySymbol } from '@/utils/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import CurrencySwitcher from '@/components/budget/CurrencySwitcher';
```

## Common Patterns

### 1. Display Budget Amount
```tsx
// Before
<span>{budget.currency} {budget.totalBudget.toLocaleString()}</span>

// After
<span>{formatCurrency(budget.totalBudget, budget.currency)}</span>
```

### 2. Display Large Amount (Compact)
```tsx
// Before
<span>₹{amount.toLocaleString()}</span>

// After
<span>{formatCurrencySmart(amount, 'INR')}</span>
// Output: INR 1.50 L (for 150000)
```

### 3. Add Currency Switcher
```tsx
<div className="flex items-center gap-2">
  <label>Currency:</label>
  <CurrencySwitcher />
</div>
```

### 4. Use Currency Context
```tsx
function BudgetSummary() {
  const { currency, symbol, formatAmount } = useCurrency();
  
  return (
    <div>
      <p>Total: {formatAmount(totalBudget)}</p>
      <p>Currency: {symbol} {currency}</p>
    </div>
  );
}
```

## Component Reference

### CurrencyConverter
Full-featured currency converter with exchange rates
```tsx
<CurrencyConverter 
  onConvert={(amount, from, to, converted) => {
    console.log(`${amount} ${from} = ${converted} ${to}`);
  }}
/>
```

### CurrencySwitcher
Simple dropdown for changing display currency
```tsx
<CurrencySwitcher />
```

### BudgetCard
Displays budget summary with formatted amounts
```tsx
<BudgetCard 
  budget={budget} 
  onUpdate={() => fetchBudgets()} 
/>
```

### BudgetDialog
Create/edit budget with currency selection
```tsx
<BudgetDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => fetchBudgets()}
  projectId={projectId}
  projectName={projectName}
/>
```

### BudgetAnalytics
Analytics dashboard with formatted charts
```tsx
<BudgetAnalytics budgets={budgets} />
```

## Formatting Options

### formatCurrency(amount, currencyCode?, showSymbol?, compact?)
```tsx
formatCurrency(150000, 'INR')              // INR 1,50,000.00
formatCurrency(150000, 'INR', true, true)  // INR 1.50 L
formatCurrency(150000, 'INR', false)       // 1,50,000.00
```

### formatCurrencySmart(amount, currencyCode?)
Auto-compact for amounts >= 100K
```tsx
formatCurrencySmart(50000, 'INR')    // INR 50,000.00
formatCurrencySmart(150000, 'INR')   // INR 1.50 L
formatCurrencySmart(10000000, 'INR') // INR 1.00 Cr
```

### getCurrencySymbol(currencyCode?)
```tsx
getCurrencySymbol('INR')  // ₹
getCurrencySymbol('USD')  // $
getCurrencySymbol('EUR')  // €
```

## Supported Currencies

| Code | Symbol | Name |
|------|--------|------|
| INR | ₹ | Indian Rupee |
| USD | $ | US Dollar |
| EUR | € | Euro |
| GBP | £ | British Pound |
| JPY | ¥ | Japanese Yen |
| AED | د.إ | UAE Dirham |
| SAR | ر.س | Saudi Riyal |
| ... | ... | 23+ total |

See `config/currency.config.ts` for complete list.

## Number Format Preferences

```tsx
import { setNumberFormat } from '@/utils/currency';

// Indian format (1,50,000)
setNumberFormat('indian');

// International format (150,000)
setNumberFormat('international');

// Auto (based on currency)
setNumberFormat('auto');
```

## Examples

### Budget Card with Formatting
```tsx
function MyBudgetCard({ budget }) {
  const spent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const remaining = budget.totalBudget - spent;
  
  return (
    <Card>
      <CardContent>
        <div>Total: {formatCurrency(budget.totalBudget, budget.currency)}</div>
        <div>Spent: {formatCurrency(spent, budget.currency)}</div>
        <div>Remaining: {formatCurrency(remaining, budget.currency)}</div>
      </CardContent>
    </Card>
  );
}
```

### Analytics with Smart Formatting
```tsx
function BudgetMetrics({ budgets }) {
  const total = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {formatCurrencySmart(total, 'INR')}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Currency Converter Integration
```tsx
function BudgetWithConverter() {
  const [showConverter, setShowConverter] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowConverter(true)}>
        Convert Currency
      </Button>
      
      {showConverter && (
        <Dialog open={showConverter} onOpenChange={setShowConverter}>
          <DialogContent>
            <CurrencyConverter 
              onConvert={(amount, from, to, converted) => {
                console.log(`Converted: ${amount} ${from} = ${converted} ${to}`);
                setShowConverter(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

## Migration Guide

### Step 1: Import utilities
```tsx
import { formatCurrency } from '@/utils/currency';
```

### Step 2: Replace manual formatting
```tsx
// Old
{budget.currency} {budget.totalBudget.toLocaleString()}

// New
{formatCurrency(budget.totalBudget, budget.currency)}
```

### Step 3: Add currency switcher (optional)
```tsx
import CurrencySwitcher from '@/components/budget/CurrencySwitcher';

<CurrencySwitcher />
```

### Step 4: Test
- Verify all amounts display correctly
- Test with different currencies
- Check compact notation for large amounts

## Troubleshooting

**Issue**: Currency symbol not showing
```tsx
// Solution: Pass currency code
formatCurrency(amount, budget.currency) // ✅
formatCurrency(amount) // ❌ Uses default
```

**Issue**: Wrong number format
```tsx
// Solution: Set number format preference
import { setNumberFormat } from '@/utils/currency';
setNumberFormat('indian'); // For Indian format
```

**Issue**: Amounts not compact
```tsx
// Solution: Use formatCurrencySmart or enable compact
formatCurrencySmart(amount, currency) // Auto-compact
formatCurrency(amount, currency, true, true) // Force compact
```
