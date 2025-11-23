# Number Format Migration Guide

## Overview
This guide helps migrate hardcoded `toLocaleString()` calls to use the new number format preference system that supports Indian (Lakhs/Crores), International (Millions/Billions), and Auto formats.

## New Utility Functions

### Import Statement
```typescript
import { formatNumber, formatCurrency } from '@/utils/currency';
```

### Available Functions

1. **formatNumber(amount, options?)** - Format numbers with user preference
2. **formatCurrency(amount, currencyCode?, showSymbol?)** - Format currency (already updated)
3. **setNumberFormat(format)** - Set user preference ('indian' | 'international' | 'auto')
4. **getNumberFormat()** - Get current preference

## Migration Patterns

### Pattern 1: Simple Number Formatting
```typescript
// OLD
amount.toLocaleString()

// NEW
formatNumber(amount)
```

### Pattern 2: Number with Decimal Places
```typescript
// OLD
amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// NEW
formatNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
```

### Pattern 3: Currency with Hardcoded Locale
```typescript
// OLD
`₹${amount.toLocaleString('en-IN')}`

// NEW
formatCurrency(amount, 'INR')
// OR if you need just the number part
`₹${formatNumber(amount)}`
```

### Pattern 4: Tooltip Formatters (Charts)
```typescript
// OLD
<Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />

// NEW
<Tooltip formatter={(value) => formatCurrency(Number(value), 'INR')} />
```

### Pattern 5: Date Formatting (Keep as is)
```typescript
// These should NOT be changed - they're for dates, not numbers
new Date(value).toLocaleString()
```

## Files to Update (Priority Order)

### High Priority - Finance & Budget Pages
- [ ] `app/dashboard/finance/**/*.tsx` (All finance pages)
- [ ] `app/dashboard/budgets/**/*.tsx` (All budget pages)
- [ ] `app/dashboard/projects/**/*.tsx` (Project financial pages)
- [ ] `components/finance/**/*.tsx` (Finance components)
- [ ] `components/budget/**/*.tsx` (Budget components)

### Medium Priority - Reports & Analytics
- [ ] `app/dashboard/reports/**/*.tsx`
- [ ] `app/dashboard/projects/analytics/**/*.tsx`
- [ ] `components/ProjectAnalyticsFiltered.tsx`

### Low Priority - Other Pages
- [ ] `app/dashboard/employees/page.tsx`
- [ ] `app/dashboard/department-budgets/**/*.tsx`
- [ ] Other miscellaneous pages

## Automated Find & Replace

### VS Code Regex Search
Search for: `\.toLocaleString\(['"]en-IN['"](?:,\s*\{[^}]+\})?\)`
Replace with: Review manually and use `formatNumber()` or `formatCurrency()`

### Important Notes
1. **DO NOT** change `new Date().toLocaleString()` - these are for dates
2. **DO NOT** change locale strings in non-numeric contexts
3. **ALWAYS** import the utility functions at the top of the file
4. **TEST** each page after migration to ensure formatting works correctly

## Example Migration

### Before
```typescript
// app/dashboard/finance/balance-sheet/page.tsx
<span className="font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
<p className="text-2xl font-bold">₹{balanceSheetData.totalAssets?.toLocaleString('en-IN')}</p>
<Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
```

### After
```typescript
import { formatCurrency, formatNumber } from '@/utils/currency';

// In component
<span className="font-medium">{formatCurrency(item.amount, 'INR')}</span>
<p className="text-2xl font-bold">{formatCurrency(balanceSheetData.totalAssets, 'INR')}</p>
<Tooltip formatter={(value: any) => formatCurrency(value, 'INR')} />
```

## Testing Checklist

After migration, test each page with:
1. Number format set to 'indian' - Should show 1,00,000 format
2. Number format set to 'international' - Should show 100,000 format
3. Number format set to 'auto' - Should use currency's native format

## User Settings UI (To Be Implemented)

Add to settings page:
```typescript
<Select value={numberFormat} onValueChange={setNumberFormat}>
  <SelectItem value="indian">Indian (Lakhs & Crores)</SelectItem>
  <SelectItem value="international">International (Millions & Billions)</SelectItem>
  <SelectItem value="auto">Auto (Based on Currency)</SelectItem>
</Select>
```

## Quick Reference

| Old Code | New Code |
|----------|----------|
| `amount.toLocaleString()` | `formatNumber(amount)` |
| `amount.toLocaleString('en-IN')` | `formatNumber(amount)` |
| `₹${amount.toLocaleString()}` | `formatCurrency(amount, 'INR')` |
| `${symbol}${amount.toLocaleString()}` | `formatCurrency(amount, currencyCode)` |
| `toLocaleString('en-IN', {min: 2})` | `formatNumber(amount, {minimumFractionDigits: 2})` |

---

**Status**: Migration in progress
**Last Updated**: 2024
