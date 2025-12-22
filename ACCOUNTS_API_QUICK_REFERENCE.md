# Accounts API - Quick Reference

## 🚀 Quick Start

### Create Account
```bash
curl -X POST http://localhost:5000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cash Account",
    "type": "ASSET",
    "openingBalance": 10000,
    "currency": "INR"
  }'
```

### Get All Accounts
```bash
curl http://localhost:5000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Account by ID
```bash
curl http://localhost:5000/api/accounts/ACCOUNT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Account
```bash
curl -X PUT http://localhost:5000/api/accounts/ACCOUNT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Cash Account",
    "balance": 15000
  }'
```

### Delete Account (Soft Delete)
```bash
curl -X DELETE http://localhost:5000/api/accounts/ACCOUNT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Duplicate Account
```bash
curl -X POST http://localhost:5000/api/accounts/ACCOUNT_ID/duplicate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Account Types

| Type | Description | Nature |
|------|-------------|--------|
| ASSET | Assets (Cash, Bank, Inventory) | Debit |
| LIABILITY | Liabilities (Loans, Payables) | Credit |
| EQUITY | Owner's Equity, Capital | Credit |
| REVENUE | Income, Sales | Credit |
| EXPENSE | Costs, Expenses | Debit |

## 🔍 Search & Filter

### Search by Name or Code
```bash
curl "http://localhost:5000/api/accounts?search=cash" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Type
```bash
curl "http://localhost:5000/api/accounts?type=ASSET" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Pagination
```bash
curl "http://localhost:5000/api/accounts?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Include Inactive Accounts
```bash
curl "http://localhost:5000/api/accounts?includeInactive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Complete Account Example

```json
{
  "code": "AST000001",
  "name": "HDFC Bank Current Account",
  "type": "ASSET",
  "subType": "Current Assets",
  "category": "Bank Accounts",
  "openingBalance": 50000,
  "currency": "INR",
  "description": "Primary business bank account",
  "contactInfo": {
    "primaryEmail": "business@company.com",
    "primaryPhone": "+91-9876543210",
    "address": "123 Business Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "taxInfo": {
    "gstNo": "27AABCU9603R1ZM",
    "panNo": "AABCU9603R",
    "tdsApplicable": true,
    "tdsRate": 10,
    "tdsSection": "194C"
  },
  "bankDetails": {
    "bankName": "HDFC Bank",
    "branch": "Andheri West",
    "accountNumber": "50100123456789",
    "ifscCode": "HDFC0001234",
    "accountType": "current"
  }
}
```

## 🎯 Frontend Usage

### React/Next.js Example

```typescript
// Fetch accounts
const fetchAccounts = async () => {
  const token = localStorage.getItem('auth-token');
  const response = await fetch(`${API_URL}/api/accounts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (data.success) {
    setAccounts(data.data);
  }
};

// Create account
const createAccount = async (accountData) => {
  const token = localStorage.getItem('auth-token');
  const response = await fetch(`${API_URL}/api/accounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(accountData)
  });
  const data = await response.json();
  if (data.success) {
    toast.success('Account created successfully');
    return data.data;
  } else {
    toast.error(data.message);
  }
};

// Update account
const updateAccount = async (id, updates) => {
  const token = localStorage.getItem('auth-token');
  const response = await fetch(`${API_URL}/api/accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  const data = await response.json();
  return data;
};

// Delete account
const deleteAccount = async (id) => {
  const token = localStorage.getItem('auth-token');
  const response = await fetch(`${API_URL}/api/accounts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  return data;
};
```

## 🔐 Validation Rules

### Required Fields
- `name` - Account name (2-100 characters)
- `type` - Must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

### Optional but Validated
- `panNo` - Format: `ABCDE1234F` (5 letters, 4 digits, 1 letter)
- `ifscCode` - Format: `SBIN0001234` (4 letters, 0, 6 alphanumeric)
- `gstNo` - Standard GST format
- `email` - Valid email format
- `phone` - Valid phone format

## ⚡ Bulk Operations

### Bulk Create (Max 100 accounts)
```bash
curl -X POST http://localhost:5000/api/accounts/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accounts": [
      {
        "name": "Account 1",
        "type": "ASSET"
      },
      {
        "name": "Account 2",
        "type": "LIABILITY"
      }
    ]
  }'
```

## 📈 Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "code": "AST000001",
    "name": "Cash Account",
    "type": "ASSET",
    "balance": 10000,
    "currency": "INR",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Account created successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Account code already exists"
}
```

### List Response with Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  },
  "stats": [
    {
      "_id": "ASSET",
      "count": 50,
      "totalBalance": 500000
    }
  ]
}
```

## 🛠️ Troubleshooting

### Issue: "Authentication required"
**Solution**: Ensure you're sending the JWT token in the Authorization header

### Issue: "Account code already exists"
**Solution**: Don't provide a code, let the system auto-generate it

### Issue: "Invalid PAN format"
**Solution**: PAN must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)

### Issue: "Invalid IFSC code format"
**Solution**: IFSC must be in format: SBIN0001234 (4 letters, 0, 6 alphanumeric)

### Issue: "Validation failed"
**Solution**: Check that name and type are provided and type is one of the valid values

## 🎨 Frontend Components

### Account Creation Form
Located at: `frontend/src/components/finance/AccountCreationForm.tsx`

Features:
- Multi-section form (Basic, Contact, Tax, Bank)
- Auto-generate account code
- Link to contacts
- Auto-create contact
- Duplicate account support
- Validation

### Accounts List Page
Located at: `frontend/src/app/dashboard/finance/accounts/page.tsx`

Features:
- Search and filter
- Pagination
- Stats cards by type
- View details modal
- Duplicate account
- Deactivate account
- Real-time updates via Socket.IO

## 📱 Keyboard Shortcuts

- `Ctrl/Cmd + K` - Create new account
- `Ctrl/Cmd + T` - Create new account type
- `Arrow Up/Down` - Navigate account list
- `Enter` - View account details

## 🔗 Related Endpoints

- `/api/contacts` - Contact management
- `/api/general-ledger/accounts/:id/ledger` - Account ledger
- `/api/journal-entries` - Journal entries
- `/api/transactions` - Transactions

---

**Need Help?** Check the complete documentation in `ACCOUNTS_CRUD_FIX.md`
