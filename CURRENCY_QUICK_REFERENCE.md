# Currency System - Quick Reference

## 🎯 Standard: USD Everywhere

### Backend Defaults
```typescript
// Project Model
currency: 'USD' (required)

// Budget Model  
currency: 'USD' (required)
```

### Frontend Usage

#### ✅ Correct Way
```typescript
import { getCurrency } from '@/utils/currency';

// Safe access with fallback
const currency = getCurrency(project);
formatAmount(amount, getCurrency(entity));
```

#### ❌ Wrong Way
```typescript
// Don't use type casting
(project as any).currency || 'INR'

// Don't use optional chaining without fallback
project.currency || 'USD'
```

## 📦 Utility Functions

### getCurrency()
```typescript
getCurrency(entity) // Returns entity.currency or 'USD'
```

### formatCurrency()
```typescript
formatCurrency(1000, 'USD') // "USD 1,000.00"
```

### isValidCurrency()
```typescript
isValidCurrency('USD') // true
isValidCurrency('XXX') // false
```

## 🔄 Exchange Rates (USD Base)

```
USD: 1.00
INR: 83.12
EUR: 0.92
GBP: 0.79
JPY: 149.50
```

## 📝 Common Patterns

### Display Amount
```typescript
formatAmount(project.budget, getCurrency(project))
```

### Budget Display
```typescript
formatAmount(budget.totalBudget, getCurrency(budget))
```

### Category Display
```typescript
formatAmount(category.allocatedAmount, getCurrency(budget))
```

## ⚠️ Migration Notes

- Existing data: Works as-is
- New records: Auto-default to USD
- Type safety: Enforced by TypeScript
- Fallback: Always USD if missing

---

**Default**: USD | **Fallback**: USD | **Type**: Required
