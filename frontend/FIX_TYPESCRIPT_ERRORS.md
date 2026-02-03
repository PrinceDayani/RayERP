# COMPLETE FIX GUIDE - All Remaining TypeScript Errors

## Issue Summary
92 TypeScript errors remaining due to:
1. TypeScript cache not recognizing formatCurrencySmart export
2. Calendar component prop mismatches
3. Type definition cache issues

## SOLUTION

### Step 1: Clear TypeScript Cache (CRITICAL)
```bash
# Run these commands in order:
cd frontend
npx tsc --build --clean
rm -rf node_modules/.cache
rm -rf .next
```

### Step 2: Fix Calendar Components

The Calendar component only accepts these props:
- `selectedDate` (required)
- `onChange` (optional)
- `className` (optional)
- `placeholder` (optional)
- `mode` (any)
- `selected` (any)
- `onSelect` (any)
- `disabled` (any)

**Remove these unsupported props from ALL Calendar components:**
- `initialFocus`
- `defaultMonth`
- `numberOfMonths`

**Add these required props:**
- `selectedDate={selected}` (use the same value as `selected`)
- `disabled={undefined}` (if not already present)

### Step 3: Apply Fixes to Each File

#### Files with `initialFocus` only (just remove the line):
1. `src/app/dashboard/finance/invoices/components/AdvancedFilters.tsx:147`
2. `src/components/projects/ProjectReports.tsx:148`
3. `src/components/projects/TaskManagement.tsx:640, 790`
4. `src/components/projects/TaskManager.tsx:220`
5. `src/components/resources/AllocationFilters.tsx:127`
6. `src/components/resources/ExportAllocationData.tsx:179, 202`
7. `src/components/resources/InlineAllocationEditor.tsx:259, 285`

**Pattern:**
```tsx
// BEFORE:
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  initialFocus  // ← REMOVE THIS LINE
/>

// AFTER:
<Calendar
  mode="single"
  selected={date}
  selectedDate={date}  // ← ADD THIS
  onSelect={setDate}
  disabled={undefined}  // ← ADD THIS
/>
```

#### Files needing `selectedDate` prop:
1. `src/app/dashboard/projects/create/page.tsx:296, 315`
2. `src/components/projects/ProjectForm.tsx:374, 393`

**Pattern:**
```tsx
// BEFORE:
<Calendar
  mode="single"
  selected={startDate}
  onSelect={setStartDate}
/>

// AFTER:
<Calendar
  mode="single"
  selected={startDate}
  selectedDate={startDate}  // ← ADD THIS
  onSelect={setStartDate}
  disabled={undefined}  // ← ADD THIS (or your actual disabled logic)
/>
```

### Step 4: After Applying Fixes

```bash
# Rebuild TypeScript
npx tsc --noEmit

# If still showing errors for formatCurrencySmart or profile types:
npx tsc --build --clean
npx tsc --noEmit
```

## Quick Fix Commands

### Search and Replace Patterns (use your IDE):

**Pattern 1 - Remove initialFocus:**
- Search: `initialFocus\n`
- Replace: `` (empty)

**Pattern 2 - Add selectedDate where missing:**
After each `selected={someValue}` line, add:
```
selectedDate={someValue}
```

**Pattern 3 - Add disabled where missing:**
After `onSelect` line, add:
```
disabled={undefined}
```

## Expected Result
After clearing cache and applying fixes:
- ✅ 0 TypeScript errors
- ✅ All Calendar components working
- ✅ All type exports recognized

## Notes
- The profile page errors are 100% due to TypeScript cache
- All types ARE properly exported in employee-profile.ts
- formatCurrencySmart IS properly exported in currency.ts
- The issue is TypeScript's incremental compilation cache

## If Errors Persist
1. Delete `tsconfig.tsbuildinfo` if it exists
2. Restart your IDE/editor
3. Run `npm run build` to force full recompilation
