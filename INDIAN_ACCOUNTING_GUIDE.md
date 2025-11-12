# 🇮🇳 Indian Accounting System - Complete Guide

## Overview

Your ERP now has a **proper Indian accounting hierarchy** compliant with standards used in Tally, Busy, and other Indian accounting software.

## 📊 Hierarchy Structure

```
Group (Top Level)
  └── Sub-Group (Middle Level)
      └── Ledger (Transaction Level)
```

### Example:
```
Assets (Group)
  └── Cash/Bank (Sub-Group)
      ├── Cash in Hand (Ledger)
      ├── HDFC Bank - Current A/c (Ledger)
      └── SBI - Savings A/c (Ledger)
```

---

## 🚀 Quick Start

### 1. Seed the Indian Chart of Accounts

```bash
cd backend
node scripts/seedIndianChartOfAccounts.js
```

This creates:
- **4 Groups**: Assets, Liabilities, Income, Expenses
- **16 Sub-Groups**: Cash/Bank, Sundry Debtors, Sundry Creditors, etc.
- **40+ Ledgers**: Sample accounts ready to use

### 2. API Endpoints

Base URL: `http://localhost:5000/api/indian-accounts`

#### Groups
```
GET    /groups              - Get all groups
POST   /groups              - Create new group
```

#### Sub-Groups
```
GET    /sub-groups          - Get all sub-groups
GET    /sub-groups?groupId=xxx - Get sub-groups by group
POST   /sub-groups          - Create new sub-group
```

#### Ledgers
```
GET    /ledgers             - Get all ledgers
GET    /ledgers?subGroupId=xxx - Get ledgers by sub-group
GET    /ledgers?search=cash - Search ledgers
GET    /ledgers/:id         - Get ledger by ID
POST   /ledgers             - Create new ledger
PUT    /ledgers/:id         - Update ledger
DELETE /ledgers/:id         - Delete ledger (soft delete)
```

#### Hierarchy View
```
GET    /hierarchy           - Get complete hierarchy (Groups → Sub-Groups → Ledgers)
```

---

## 📋 Standard Groups & Sub-Groups

### 1. Assets (GRP-001)
- **Current Assets** (SG-A001)
- **Fixed Assets** (SG-A002)
- **Cash/Bank** (SG-A003)
- **Sundry Debtors** (SG-A004) - Customer receivables
- **Stock-in-Hand** (SG-A005) - Inventory
- **Loans & Advances (Asset)** (SG-A006)

### 2. Liabilities (GRP-002)
- **Current Liabilities** (SG-L001)
- **Sundry Creditors** (SG-L002) - Supplier payables
- **Duties & Taxes** (SG-L003) - GST, TDS, etc.
- **Loans (Liability)** (SG-L004)
- **Capital Account** (SG-L005)
- **Reserves & Surplus** (SG-L006)

### 3. Income (GRP-003)
- **Direct Income** (SG-I001)
- **Indirect Income** (SG-I002)
- **Sales Accounts** (SG-I003)

### 4. Expenses (GRP-004)
- **Direct Expenses** (SG-E001)
- **Indirect Expenses** (SG-E002)
- **Purchase Accounts** (SG-E003)

---

## 💡 Sample Ledgers

### Cash & Bank
- Cash in Hand (LED-001)
- Petty Cash (LED-002)
- HDFC Bank - Current A/c (LED-003)
- SBI - Savings A/c (LED-004)
- ICICI Bank - CC A/c (LED-005)

### Fixed Assets
- Land & Building (LED-010)
- Plant & Machinery (LED-011)
- Furniture & Fixtures (LED-012)
- Computer & Equipment (LED-013)
- Vehicles (LED-014)

### Taxes
- GST Payable (LED-050)
- TDS Payable (LED-051)
- Professional Tax (LED-052)
- GST Input (LED-053)

### Expenses
- Salary & Wages (LED-100)
- Rent Paid (LED-101)
- Electricity Charges (LED-102)
- Telephone Expenses (LED-103)
- Office Expenses (LED-104)
- Bank Charges (LED-107)
- Interest Paid (LED-108)
- Depreciation (LED-109)

---

## 🇮🇳 Indian Compliance Features

### GST Information
```typescript
gstInfo: {
  gstNo: "27AABCU9603R1ZM",
  gstType: "regular" | "composition" | "unregistered"
}
```

### Tax Information
```typescript
taxInfo: {
  panNo: "ABCDE1234F",
  tanNo: "DELA12345E",
  cinNo: "U12345DL2020PTC123456",
  aadharNo: "1234 5678 9012"
}
```

### Contact Information
```typescript
contactInfo: {
  email: "contact@example.com",
  phone: "011-12345678",
  mobile: "9876543210",
  address: "123 Main Street",
  city: "New Delhi",
  state: "Delhi",
  country: "India",
  pincode: "110001"
}
```

### Bank Details
```typescript
bankDetails: {
  accountNumber: "1234567890",
  ifscCode: "HDFC0001234",
  bankName: "HDFC Bank",
  branch: "Connaught Place"
}
```

### Credit Management
```typescript
creditLimit: 100000,  // ₹1,00,000
creditDays: 30        // 30 days credit period
```

---

## 📝 Creating Ledgers

### Example: Create a Customer Ledger

```json
POST /api/indian-accounts/ledgers
{
  "code": "LED-200",
  "name": "ABC Pvt Ltd",
  "subGroupId": "673abc...",  // Sundry Debtors sub-group ID
  "openingBalance": 50000,
  "balanceType": "debit",
  "currency": "INR",
  "gstInfo": {
    "gstNo": "27AABCU9603R1ZM",
    "gstType": "regular"
  },
  "contactInfo": {
    "email": "abc@example.com",
    "phone": "011-12345678",
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "creditLimit": 200000,
  "creditDays": 45
}
```

### Example: Create a Supplier Ledger

```json
POST /api/indian-accounts/ledgers
{
  "code": "LED-201",
  "name": "XYZ Suppliers",
  "subGroupId": "673def...",  // Sundry Creditors sub-group ID
  "openingBalance": 75000,
  "balanceType": "credit",
  "currency": "INR",
  "gstInfo": {
    "gstNo": "29AABCU9603R1ZM",
    "gstType": "regular"
  },
  "contactInfo": {
    "email": "xyz@example.com",
    "mobile": "9876543210",
    "city": "Bangalore",
    "state": "Karnataka"
  }
}
```

---

## 🔄 Migration from Old System

Your old `Account` model is still available. To migrate:

1. **Keep both systems** running in parallel
2. **Gradually migrate** transactions to the new system
3. **Use the hierarchy endpoint** to understand the structure
4. **Update frontend** to use new endpoints

---

## 📊 Balance Types

- **Debit Balance**: Assets, Expenses
  - Cash, Bank, Debtors, Fixed Assets, Purchases, Salaries
  
- **Credit Balance**: Liabilities, Income
  - Creditors, Loans, Capital, Sales, Interest Income

---

## ✅ Compliance Checklist

- [x] Group → Sub-Group → Ledger hierarchy
- [x] Indian standard groups (Assets, Liabilities, Income, Expenses)
- [x] Sundry Debtors & Creditors
- [x] GST fields (GST No, GST Type)
- [x] Tax fields (PAN, TAN, CIN, Aadhar)
- [x] Bank details (Account No, IFSC)
- [x] Credit management (Limit, Days)
- [x] Contact information
- [x] INR currency default
- [x] Debit/Credit balance types

---

## 🎯 Next Steps

1. **Integrate with Journal Entries**: Update journal entry system to use ledgers
2. **GST Reports**: Build GSTR-1, GSTR-3B reports
3. **TDS Module**: Add TDS deduction and reporting
4. **Voucher Types**: Implement Payment, Receipt, Contra, Journal vouchers
5. **Financial Reports**: Trial Balance, Balance Sheet, P&L using new hierarchy

---

## 📚 References

- Tally ERP 9 Chart of Accounts
- Indian Accounting Standards (Ind AS)
- GST Compliance Requirements
- Companies Act 2013

---

**Built with ❤️ for Indian businesses**
