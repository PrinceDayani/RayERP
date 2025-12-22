# Account Group Assignment - Implementation

## ✅ Feature Added

Accounts can now be assigned to Groups and Sub-Groups for better organization and categorization.

## Changes Made

### 1. Backend Model Update
**File**: `backend/src/models/ChartOfAccount.ts`

Added fields:
```typescript
groupId?: mongoose.Types.ObjectId;      // Reference to AccountGroup
subGroupId?: mongoose.Types.ObjectId;   // Reference to AccountSubGroup
```

### 2. Backend Controller Update
**File**: `backend/src/controllers/accountController.ts`

Updated queries to populate group data:
```typescript
.populate('groupId', 'name code')
.populate('subGroupId', 'name code')
```

### 3. Frontend Form Update
**File**: `frontend/src/components/finance/AccountCreationForm.tsx`

Added:
- Group dropdown (fetches from `/api/general-ledger/groups`)
- Sub-Group dropdown (fetches based on selected group)
- Cascading selection (sub-groups filter by group)

### 4. Frontend List Update
**File**: `frontend/src/app/dashboard/finance/accounts/page.tsx`

Added:
- Group column in accounts table
- Display group and sub-group names
- Updated interface to include group fields

## How It Works

### Account Creation Flow
1. User selects **Account Type** (ASSET, LIABILITY, etc.)
2. User selects **Group** (optional)
3. If group selected, **Sub-Groups** load automatically
4. User selects **Sub-Group** (optional)
5. Account is created with group assignments

### Cascading Selection
```
Account Type → Group → Sub-Group
     ↓           ↓         ↓
   ASSET    → Cash   → Petty Cash
```

## API Endpoints Used

### Fetch Groups
```
GET /api/general-ledger/groups
```

### Fetch Sub-Groups
```
GET /api/general-ledger/sub-groups?groupId={groupId}
```

## Database Structure

### AccountGroup
- code
- name
- type (assets, liabilities, income, expenses)
- description
- isActive

### AccountSubGroup
- code
- name
- groupId (reference to AccountGroup)
- parentSubGroupId (for nested sub-groups)
- level
- description
- isActive

### ChartOfAccount
- ... existing fields ...
- groupId (reference to AccountGroup)
- subGroupId (reference to AccountSubGroup)

## UI Changes

### Account Creation Form
```
┌─────────────────────────────────────┐
│ Account Name: [____________]        │
│ Account Type: [ASSET ▼]             │
│ Group:        [Cash ▼]              │  ← NEW
│ Sub Group:    [Petty Cash ▼]        │  ← NEW
│ Sub Type:     [____________]        │
│ ...                                 │
└─────────────────────────────────────┘
```

### Accounts List Table
```
Code    | Name        | Type  | Group      | Sub Type | Balance
--------|-------------|-------|------------|----------|--------
AST001  | Petty Cash  | ASSET | Cash       | Current  | 5,000
                              | Petty Cash |          |
```

## Benefits

1. **Better Organization** - Accounts grouped logically
2. **Easier Reporting** - Filter by group/sub-group
3. **Compliance** - Matches standard accounting practices
4. **Flexibility** - Optional assignment (not required)
5. **Hierarchy** - Multi-level categorization

## Example Usage

### Create Account with Group
```json
{
  "name": "Petty Cash",
  "type": "ASSET",
  "groupId": "60d5ec49f1b2c8b1f8e4e1a1",
  "subGroupId": "60d5ec49f1b2c8b1f8e4e1a2",
  "openingBalance": 5000,
  "currency": "INR"
}
```

### Response with Group Data
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Petty Cash",
    "type": "ASSET",
    "groupId": {
      "_id": "...",
      "name": "Cash",
      "code": "CASH"
    },
    "subGroupId": {
      "_id": "...",
      "name": "Petty Cash",
      "code": "PCASH"
    }
  }
}
```

## Testing

- [x] Create account with group
- [x] Create account with group and sub-group
- [x] Create account without group (optional)
- [x] Sub-groups filter by selected group
- [x] Display group in accounts list
- [x] Populate group data in API responses

## Status

✅ **COMPLETE** - Group assignment fully functional

---

**Version**: 1.0.0  
**Date**: 2024  
**Feature**: Account Group Assignment
