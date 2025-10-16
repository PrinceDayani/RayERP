# Currency Change Summary: USD to INR

## Overview
All currency references have been changed from USD ($) to INR (₹) throughout the RayERP application.

## Changes Made

### Frontend Changes

#### 1. **formatters.ts** (`frontend/src/utils/formatters.ts`)
- Changed default currency from `'USD'` to `'INR'`
- Changed locale from `'en-US'` to `'en-IN'`
- This affects all currency formatting throughout the application

#### 2. **CurrencyConverter.tsx** (`frontend/src/components/budget/CurrencyConverter.tsx`)
- Changed default `toCurrency` from `"USD"` to `"INR"`
- Updated exchange rates to use INR as base currency (1 INR = 1)
- Updated all exchange rates:
  - USD: 0.012 → 83.12 (INR per USD)
  - EUR: 0.010 → 90.45 (INR per EUR)
  - GBP: 0.009 → 105.23 (INR per GBP)
  - JPY: 1.80 → 0.56 (INR per JPY)
  - CAD: 0.016 → 61.34 (INR per CAD)
  - AUD: 0.018 → 54.78 (INR per AUD)
  - CHF: 0.011 → 95.67 (INR per CHF)
- Changed conversion logic from USD-based to INR-based

#### 3. **BudgetDialog.tsx** (`frontend/src/components/budget/BudgetDialog.tsx`)
- Changed default currency from `"USD"` to `"INR"`
- Updated exchange rates in currencies array to INR-based rates
- Changed fallback currency from `'USD'` to `'INR'`

#### 4. **StatsCards.tsx** (`frontend/src/components/Dashboard/StatsCards.tsx`)
- Already using INR with `'en-IN'` locale ✓

### Backend Changes

#### 1. **Budget.ts** (`backend/src/models/Budget.ts`)
- Changed default currency from `'USD'` to `'INR'`

#### 2. **AdminSettings.ts** (`backend/src/models/AdminSettings.ts`)
- Changed default currency in general settings from `'USD'` to `'INR'`

#### 3. **Payment.ts** (`backend/src/models/Payment.ts`)
- Changed virtual field `formattedAmount` currency from `'USD'` to `'INR'`
- Changed locale from `'en-US'` to `'en-IN'`

#### 4. **Expense.ts** (`backend/src/models/Expense.ts`)
- Changed locale from `'en-US'` to `'en-IN'` (already had INR)

## Currency Symbol Changes

- **Old Symbol**: $ (Dollar)
- **New Symbol**: ₹ (Rupee)

## Exchange Rate Base

- **Old Base**: USD (1 USD = base)
- **New Base**: INR (1 INR = base)

## Impact

### User-Facing Changes
1. All monetary values now display in INR (₹)
2. Currency formatting follows Indian numbering system (lakhs, crores)
3. Exchange rates are now relative to INR

### Database Changes
1. New budgets will default to INR
2. New admin settings will default to INR
3. Existing records with USD will need manual migration if required

### API Changes
1. All currency-related API responses will use INR formatting
2. Virtual fields in models now return INR-formatted values

## Migration Notes

### For Existing Data
If you have existing data in USD, you may want to:
1. Run a migration script to convert USD amounts to INR
2. Update currency fields in existing records
3. Multiply USD amounts by ~83 to get approximate INR values

### For New Installations
- No migration needed
- All defaults are set to INR

## Testing Checklist

- [ ] Budget creation with INR
- [ ] Currency converter with INR as base
- [ ] Dashboard statistics display
- [ ] Payment records formatting
- [ ] Expense records formatting
- [ ] Invoice generation (if applicable)
- [ ] Financial reports
- [ ] Admin settings default currency

## Files Modified

### Frontend (4 files)
1. `frontend/src/utils/formatters.ts`
2. `frontend/src/components/budget/CurrencyConverter.tsx`
3. `frontend/src/components/budget/BudgetDialog.tsx`
4. `frontend/src/components/Dashboard/StatsCards.tsx` (already correct)

### Backend (4 files)
1. `backend/src/models/Budget.ts`
2. `backend/src/models/AdminSettings.ts`
3. `backend/src/models/Payment.ts`
4. `backend/src/models/Expense.ts`

## Total Changes
- **8 files modified**
- **Currency symbol**: $ → ₹
- **Default currency**: USD → INR
- **Locale**: en-US → en-IN
- **Exchange rate base**: USD → INR

---

**Date**: 2025
**Status**: ✅ Complete
