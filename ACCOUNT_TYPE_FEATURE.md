# Account Type Management Feature

## Overview
Complete implementation of dynamic account type management system allowing users to create custom account types beyond the default system types.

## Backend Implementation

### 1. Database Model
**File:** `backend/src/models/AccountType.ts`
- Stores custom account types
- Fields: name, value, description, nature (debit/credit), isSystem, isActive
- System types cannot be modified or deleted

### 2. API Endpoints
**File:** `backend/src/routes/account.routes.ts`

```
GET    /api/accounts/types          - Get all account types (system + custom)
POST   /api/accounts/types          - Create new account type
PUT    /api/accounts/types/:id      - Update account type (custom only)
DELETE /api/accounts/types/:id      - Delete account type (custom only)
```

### 3. Controller Functions
**File:** `backend/src/controllers/accountController.ts`

- `getAccountTypes()` - Returns system + custom types with usage counts
- `createAccountType()` - Creates new custom type with validation
- `updateAccountType()` - Updates custom type (prevents system type modification)
- `deleteAccountType()` - Soft deletes type (checks if in use)

### 4. Seed Script
**File:** `backend/src/scripts/seedAccountTypes.ts`

Run to initialize default system types:
```bash
cd backend
npx ts-node src/scripts/seedAccountTypes.ts
```

## Frontend Implementation

### 1. Account Creation Form
**File:** `frontend/src/components/finance/AccountCreationForm.tsx`

Features:
- "Add Account Type" button at top of form
- Fetches types dynamically from API
- Dialog for creating new types
- Auto-refreshes type list after creation

### 2. Type Creation Dialog
Fields:
- **Type Name** (required) - Display name
- **Description** (optional) - Purpose description
- **Nature** (required) - Debit or Credit

### 3. Universal Form Component
**File:** `frontend/src/components/common/AccountCreationForm.tsx`
- Renders dynamic form sections
- Supports all field types
- Used across entire finance module

## Usage

### Creating a New Account Type

1. Open any account creation form
2. Click "Add Account Type" button
3. Fill in:
   - Name: e.g., "Fixed Assets"
   - Description: e.g., "Long-term tangible assets"
   - Nature: Select "Debit" or "Credit"
4. Click "Create"
5. New type appears in dropdown immediately

### Account Type Rules

**System Types (Cannot be modified):**
- Asset (Debit)
- Liability (Credit)
- Equity (Credit)
- Revenue (Credit)
- Expense (Debit)

**Custom Types:**
- Can be created by any authenticated user
- Can be edited (name, description, nature)
- Can be deleted if no accounts use them
- Auto-generates value from name (lowercase, underscores)

## Integration Points

The account type feature is integrated in:
1. ✅ Account creation form (`accounts/page.tsx`)
2. ✅ Chart of accounts (`chart-of-accounts/page.tsx`)
3. ✅ Account selector (used in vouchers, journal entries)
4. ✅ All finance module forms

## API Response Format

### GET /api/accounts/types
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "value": "asset",
      "label": "Asset",
      "description": "Resources owned by the business",
      "nature": "debit",
      "isSystem": true,
      "count": 45
    },
    {
      "_id": "...",
      "value": "fixed_assets",
      "label": "Fixed Assets",
      "description": "Long-term tangible assets",
      "nature": "debit",
      "isSystem": false,
      "count": 12
    }
  ]
}
```

### POST /api/accounts/types
```json
{
  "name": "Fixed Assets",
  "description": "Long-term tangible assets",
  "nature": "debit"
}
```

## Validation

### Backend Validation
- Name and nature are required
- Nature must be "debit" or "credit"
- Duplicate names/values prevented
- System types cannot be modified/deleted
- Types in use cannot be deleted

### Frontend Validation
- Name required before submission
- Nature selection required
- Toast notifications for success/error

## Database Schema

```typescript
{
  name: String (required, unique),
  value: String (required, unique),
  description: String (optional),
  nature: 'debit' | 'credit' (required),
  isSystem: Boolean (default: false),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

1. **Create Type:** Add "Fixed Assets" with debit nature
2. **Use Type:** Create account with new type
3. **Edit Type:** Update description
4. **Delete Protection:** Try deleting type in use (should fail)
5. **Delete Unused:** Delete type with no accounts (should succeed)

## Future Enhancements

- [ ] Bulk import account types
- [ ] Type templates by industry
- [ ] Type hierarchy/sub-types
- [ ] Custom nature options
- [ ] Type usage analytics
