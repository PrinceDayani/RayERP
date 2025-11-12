# Nested Subgroups with Accounts in General Ledger

## Overview
The General Ledger now supports a complete 4-level hierarchy:
- **Group** → **SubGroup (nested)** → **Account** → **Ledger**

Users can create unlimited nested subgroups and organize accounts within them.

## Hierarchy Structure
```
Group (Level 0)
  └── Sub-Group (Level 1)
      └── Sub-Group (Level 2)
          └── Sub-Group (Level n...)
              └── Account
                  └── Ledger
                  └── Ledger
```

## Key Features
- **Unlimited SubGroup Nesting**: Create as many subgroup levels as needed
- **Accounts Layer**: Accounts sit between subgroups and ledgers
- **Flexible Structure**: Users decide the depth and organization
- **Level Tracking**: Automatic level calculation for subgroups

## Data Models

### AccountGroup
```typescript
{
  code: string;
  name: string;
  type: 'assets' | 'liabilities' | 'income' | 'expenses';
  isActive: boolean;
}
```

### AccountSubGroup (Self-Referencing)
```typescript
{
  code: string;
  name: string;
  groupId: ObjectId;              // Parent group (required)
  parentSubGroupId: ObjectId;     // Parent subgroup (optional)
  level: number;                  // Nesting level (1, 2, 3, ...)
  isActive: boolean;
}
```

### Account
```typescript
{
  code: string;
  name: string;
  subGroupId: ObjectId;           // Parent subgroup (required)
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  isActive: boolean;
}
```

### AccountLedger
```typescript
{
  code: string;
  name: string;
  accountId: ObjectId;            // Parent account (required)
  currentBalance: number;
  balanceType: 'debit' | 'credit';
  isActive: boolean;
}
```

## API Endpoints

### Groups
```
GET    /api/general-ledger/groups
GET    /api/general-ledger/groups/:id
POST   /api/general-ledger/groups
```

### Sub-Groups
```
GET    /api/general-ledger/sub-groups?groupId={id}&parentSubGroupId={id}
GET    /api/general-ledger/sub-groups/:id
POST   /api/general-ledger/sub-groups
```

### Accounts
```
GET    /api/general-ledger/accounts
POST   /api/general-ledger/accounts
PUT    /api/general-ledger/accounts/:id
DELETE /api/general-ledger/accounts/:id
```

### Ledgers
```
GET    /api/general-ledger/ledgers?accountId={id}
GET    /api/general-ledger/ledgers/:id
POST   /api/general-ledger/ledgers
PUT    /api/general-ledger/ledgers/:id
DELETE /api/general-ledger/ledgers/:id
```

### Hierarchy
```
GET    /api/general-ledger/hierarchy
```
Returns complete nested tree: Groups → SubGroups → Accounts → Ledgers

## Example Usage

### Creating Complete Hierarchy
```javascript
// 1. Create Group
POST /api/general-ledger/groups
{
  "code": "ASSETS",
  "name": "Assets",
  "type": "assets"
}

// 2. Create Level 1 SubGroup
POST /api/general-ledger/sub-groups
{
  "code": "CURR-ASSETS",
  "name": "Current Assets",
  "groupId": "group_id",
  "parentSubGroupId": null
}

// 3. Create Level 2 SubGroup
POST /api/general-ledger/sub-groups
{
  "code": "CASH-BANK",
  "name": "Cash & Bank",
  "groupId": "group_id",
  "parentSubGroupId": "level1_id"
}

// 4. Create Account
POST /api/general-ledger/accounts
{
  "code": "ACC-001",
  "name": "Petty Cash Account",
  "subGroupId": "level2_id",
  "type": "asset"
}

// 5. Create Ledger
POST /api/general-ledger/ledgers
{
  "code": "LED-001",
  "name": "Office Petty Cash",
  "accountId": "account_id",
  "openingBalance": 10000,
  "balanceType": "debit"
}
```

## Benefits
1. **Complete Flexibility**: 4-level hierarchy adapts to any structure
2. **Unlimited Nesting**: SubGroups can nest infinitely
3. **Clear Organization**: Group → SubGroup → Account → Ledger
4. **Indian Accounting**: Supports complex Indian accounting standards
5. **Scalability**: Grow your chart of accounts as needed

## Migration Notes
- Existing `AccountLedger` now references `accountId` instead of `subGroupId`
- `Account` model now has optional `subGroupId` field
- Old self-referencing `Account.parentId` still supported for legacy data
