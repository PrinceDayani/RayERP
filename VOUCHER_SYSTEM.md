# Complete Voucher System Documentation

## Overview
Production-ready voucher management system supporting all 8 voucher types with full accounting integration, transaction management, and audit trails.

## Voucher Types

### 1. **Payment Voucher (PAY)**
- **Purpose**: Record cash/bank payments to vendors, suppliers, or expenses
- **Use Cases**: Vendor payments, expense payments, salary payments
- **Key Fields**: Party name, payment mode, cheque details, bank account

### 2. **Receipt Voucher (REC)**
- **Purpose**: Record cash/bank receipts from customers or other sources
- **Use Cases**: Customer payments, income receipts, advance receipts
- **Key Fields**: Party name, payment mode, cheque details, bank account

### 3. **Contra Voucher (CON)**
- **Purpose**: Record cash-to-bank or bank-to-cash transfers
- **Use Cases**: Cash deposits, cash withdrawals, inter-bank transfers
- **Key Fields**: From account, to account, transfer details

### 4. **Sales Voucher (SAL)**
- **Purpose**: Record sales transactions and revenue
- **Use Cases**: Product sales, service sales, invoice generation
- **Key Fields**: Customer details, invoice number, invoice date, tax amount

### 5. **Purchase Voucher (PUR)**
- **Purpose**: Record purchase transactions and expenses
- **Use Cases**: Inventory purchases, asset purchases, service purchases
- **Key Fields**: Vendor details, invoice number, invoice date, tax amount

### 6. **Journal Voucher (JOU)**
- **Purpose**: Record adjustments, corrections, and non-cash transactions
- **Use Cases**: Depreciation, accruals, provisions, adjustments
- **Key Fields**: Multiple accounts, narration, cost center

### 7. **Debit Note (DN)**
- **Purpose**: Record purchase returns or vendor claim adjustments
- **Use Cases**: Return to supplier, price adjustments, claim settlements
- **Key Fields**: Original invoice reference, vendor details, reason

### 8. **Credit Note (CN)**
- **Purpose**: Record sales returns or customer credit adjustments
- **Use Cases**: Sales returns, discounts, refunds to customers
- **Key Fields**: Original invoice reference, customer details, reason

## Features

### Core Functionality
- ✅ **8 Voucher Types**: Complete support for all accounting voucher types
- ✅ **Auto-Numbering**: Automatic voucher number generation with fiscal year prefix
- ✅ **Double-Entry Validation**: Ensures debits equal credits before posting
- ✅ **Multi-Line Entries**: Support for complex transactions with multiple accounts
- ✅ **Account Integration**: Direct integration with Chart of Accounts
- ✅ **Real-time Balance Updates**: Automatic account balance updates on posting

### Transaction Management
- ✅ **Draft Mode**: Create and edit vouchers before posting
- ✅ **Post Voucher**: Lock voucher and update account balances
- ✅ **Cancel Voucher**: Reverse posted vouchers with reason tracking
- ✅ **Delete Draft**: Remove unposted vouchers
- ✅ **Transaction Atomicity**: Database transactions ensure data consistency

### Advanced Features
- ✅ **Party Management**: Track vendors, customers, and other parties
- ✅ **Payment Modes**: Cash, Bank, Cheque, UPI, Card, NEFT, RTGS
- ✅ **Cheque Tracking**: Cheque number and date for cheque payments
- ✅ **Invoice Linking**: Link vouchers to invoices with reference numbers
- ✅ **Cost Center Allocation**: Assign transactions to cost centers
- ✅ **Department Tracking**: Track departmental expenses and revenues
- ✅ **Project Allocation**: Link transactions to projects
- ✅ **Tax Management**: Track tax amounts separately
- ✅ **Discount Tracking**: Record discount amounts
- ✅ **File Attachments**: Attach supporting documents

### Reporting & Analytics
- ✅ **Voucher Statistics**: Real-time stats by type and status
- ✅ **Search & Filter**: Advanced search with multiple filters
- ✅ **Status Tracking**: Draft, Posted, Cancelled status management
- ✅ **Audit Trail**: Complete history with user and timestamp tracking
- ✅ **Journal Entry Integration**: Auto-create journal entries on posting

### Security & Compliance
- ✅ **User Authentication**: JWT-based authentication required
- ✅ **Authorization**: Role-based access control
- ✅ **Approval Workflow**: Track who approved/posted vouchers
- ✅ **Cancellation Tracking**: Record who cancelled and why
- ✅ **Immutable Posted Vouchers**: Cannot edit posted vouchers
- ✅ **Audit Logging**: Complete audit trail for compliance

## API Endpoints

### Base URL
```
http://localhost:5000/api/vouchers
```

### Endpoints

#### 1. Create Voucher
```http
POST /api/vouchers
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucherType": "payment",
  "date": "2024-01-15",
  "reference": "REF-001",
  "narration": "Payment for office supplies",
  "partyName": "ABC Suppliers",
  "paymentMode": "cheque",
  "chequeNumber": "123456",
  "chequeDate": "2024-01-15",
  "lines": [
    {
      "accountId": "account_id_1",
      "debit": 10000,
      "credit": 0,
      "description": "Office supplies"
    },
    {
      "accountId": "account_id_2",
      "debit": 0,
      "credit": 10000,
      "description": "Bank payment"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "voucher_id",
    "voucherNumber": "PAY24000001",
    "voucherType": "payment",
    "status": "draft",
    "totalAmount": 10000,
    ...
  }
}
```

#### 2. Get All Vouchers
```http
GET /api/vouchers?voucherType=payment&status=posted&search=ABC&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `voucherType`: Filter by type (payment, receipt, contra, sales, purchase, journal, debit_note, credit_note)
- `status`: Filter by status (draft, posted, cancelled)
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)
- `partyId`: Filter by party account ID
- `search`: Search in voucher number, reference, narration, party name
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

#### 3. Get Voucher by ID
```http
GET /api/vouchers/:id
Authorization: Bearer <token>
```

#### 4. Update Voucher (Draft Only)
```http
PUT /api/vouchers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "narration": "Updated narration",
  "lines": [...]
}
```

#### 5. Post Voucher
```http
POST /api/vouchers/:id/post
Authorization: Bearer <token>
```

**Actions:**
- Updates account balances
- Creates journal entry
- Sets status to 'posted'
- Records approval details
- Cannot be undone (only cancelled)

#### 6. Cancel Voucher
```http
POST /api/vouchers/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Duplicate entry"
}
```

**Actions:**
- Reverses account balance changes
- Sets status to 'cancelled'
- Records cancellation details
- Preserves audit trail

#### 7. Delete Voucher (Draft Only)
```http
DELETE /api/vouchers/:id
Authorization: Bearer <token>
```

#### 8. Get Voucher Statistics
```http
GET /api/vouchers/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "count": 50,
      "totalAmount": 500000,
      "posted": 45,
      "draft": 3,
      "cancelled": 2
    },
    "receipt": {...},
    ...
  }
}
```

## Database Schema

### Voucher Model
```typescript
{
  voucherType: 'payment' | 'receipt' | 'contra' | 'sales' | 'purchase' | 'journal' | 'debit_note' | 'credit_note',
  voucherNumber: string,              // Auto-generated: PAY24000001
  date: Date,
  reference?: string,
  narration: string,
  lines: [{
    accountId: ObjectId,              // Reference to Account
    debit: number,
    credit: number,
    description?: string,
    costCenter?: string,
    departmentId?: ObjectId,
    projectId?: ObjectId
  }],
  totalAmount: number,
  isPosted: boolean,
  status: 'draft' | 'posted' | 'cancelled',
  
  // Party Details
  partyId?: ObjectId,
  partyName?: string,
  
  // Payment Details
  paymentMode?: 'cash' | 'bank' | 'cheque' | 'upi' | 'card' | 'neft' | 'rtgs',
  chequeNumber?: string,
  chequeDate?: Date,
  bankAccountId?: ObjectId,
  
  // Invoice Details
  invoiceNumber?: string,
  invoiceDate?: Date,
  dueDate?: Date,
  
  // Financial Details
  taxAmount?: number,
  discountAmount?: number,
  
  // Attachments
  attachments?: string[],
  
  // Approval & Audit
  approvedBy?: ObjectId,
  approvedAt?: Date,
  cancelledBy?: ObjectId,
  cancelledAt?: Date,
  cancellationReason?: string,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `voucherType` + `date` (compound)
- `status` + `date` (compound)
- `voucherNumber` (unique)
- `partyId`
- `createdBy`

## Frontend Features

### Dashboard View
- **Summary Cards**: 8 cards showing stats for each voucher type
- **Quick Filters**: Filter by type, status, date range
- **Search**: Search across voucher number, reference, narration, party
- **Real-time Stats**: Live count and amount totals

### Voucher List
- **Tabular View**: All vouchers with key information
- **Status Badges**: Visual status indicators (Draft, Posted, Cancelled)
- **Quick Actions**: View, Post, Cancel, Delete buttons
- **Pagination**: Handle large datasets efficiently
- **Responsive Design**: Works on all screen sizes

### Create Voucher Form
- **Type Selection**: Choose from 8 voucher types
- **Dynamic Fields**: Show/hide fields based on voucher type
- **Multi-Line Entry**: Add unlimited transaction lines
- **Real-time Validation**: Check debit/credit balance
- **Account Search**: Searchable account dropdown
- **Auto-calculation**: Automatic total calculation
- **Form Validation**: Client-side and server-side validation

### View Voucher Dialog
- **Complete Details**: All voucher information
- **Transaction Lines**: Formatted table view
- **Status History**: Approval and cancellation details
- **Quick Actions**: Post or cancel from view dialog

## Usage Examples

### Example 1: Payment Voucher
```javascript
// Pay vendor for supplies
{
  "voucherType": "payment",
  "date": "2024-01-15",
  "narration": "Payment to ABC Suppliers for office supplies",
  "partyName": "ABC Suppliers",
  "paymentMode": "bank",
  "reference": "PO-2024-001",
  "lines": [
    {
      "accountId": "expense_account_id",
      "debit": 50000,
      "credit": 0,
      "description": "Office supplies expense"
    },
    {
      "accountId": "bank_account_id",
      "debit": 0,
      "credit": 50000,
      "description": "Payment from HDFC Bank"
    }
  ]
}
```

### Example 2: Sales Voucher
```javascript
// Record customer sale
{
  "voucherType": "sales",
  "date": "2024-01-15",
  "narration": "Sale to XYZ Corp",
  "partyName": "XYZ Corp",
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15",
  "taxAmount": 9000,
  "lines": [
    {
      "accountId": "customer_account_id",
      "debit": 59000,
      "credit": 0,
      "description": "Customer receivable"
    },
    {
      "accountId": "sales_account_id",
      "debit": 0,
      "credit": 50000,
      "description": "Sales revenue"
    },
    {
      "accountId": "tax_account_id",
      "debit": 0,
      "credit": 9000,
      "description": "GST @ 18%"
    }
  ]
}
```

### Example 3: Journal Voucher
```javascript
// Record depreciation
{
  "voucherType": "journal",
  "date": "2024-01-31",
  "narration": "Monthly depreciation on fixed assets",
  "reference": "DEP-JAN-2024",
  "lines": [
    {
      "accountId": "depreciation_expense_id",
      "debit": 25000,
      "credit": 0,
      "description": "Depreciation expense",
      "costCenter": "ADMIN"
    },
    {
      "accountId": "accumulated_depreciation_id",
      "debit": 0,
      "credit": 25000,
      "description": "Accumulated depreciation"
    }
  ]
}
```

## Best Practices

### 1. Voucher Creation
- Always provide clear narration
- Use reference numbers for traceability
- Verify account selection before posting
- Double-check debit/credit amounts
- Attach supporting documents

### 2. Posting Vouchers
- Review all details before posting
- Ensure correct date and period
- Verify party and payment details
- Check account balances after posting
- Cannot edit after posting

### 3. Cancellation
- Always provide cancellation reason
- Create correcting entry if needed
- Inform relevant stakeholders
- Maintain audit trail

### 4. Data Entry
- Use consistent naming conventions
- Maintain party name consistency
- Use proper account codes
- Add descriptions for clarity
- Link to projects/departments when applicable

## Integration Points

### 1. Chart of Accounts
- Validates account existence and status
- Updates account balances on posting
- Supports account hierarchy

### 2. Journal Entries
- Auto-creates journal entry on posting
- Links voucher to journal entry
- Maintains double-entry integrity

### 3. Account Ledger
- Voucher transactions appear in ledger
- Supports ledger reporting
- Enables reconciliation

### 4. Financial Reports
- Vouchers feed into P&L statement
- Included in balance sheet
- Part of cash flow analysis

## Error Handling

### Common Errors
1. **Debits ≠ Credits**: Ensure totals match
2. **Invalid Account**: Check account exists and is active
3. **Posted Voucher Edit**: Cannot edit posted vouchers
4. **Missing Required Fields**: Fill all mandatory fields
5. **Duplicate Voucher Number**: System auto-generates unique numbers

### Validation Rules
- At least one line item required
- Debits must equal credits (±0.01 tolerance)
- All accounts must exist and be active
- Date cannot be in closed period
- Posted vouchers cannot be edited
- Only draft vouchers can be deleted

## Performance Optimization

### Database
- Indexed fields for fast queries
- Compound indexes for common filters
- Pagination for large datasets
- Aggregation for statistics

### Frontend
- Lazy loading for large lists
- Debounced search
- Cached account list
- Optimistic UI updates

## Security Considerations

### Authentication
- JWT token required for all operations
- Token expiry and refresh
- Secure token storage

### Authorization
- Role-based access control
- Permission checks per operation
- Audit logging for all actions

### Data Validation
- Server-side validation
- SQL injection prevention
- XSS protection
- Input sanitization

## Testing

### Unit Tests
- Voucher creation validation
- Debit/credit balance check
- Account balance updates
- Status transitions

### Integration Tests
- End-to-end voucher flow
- Journal entry creation
- Account balance verification
- Cancellation reversal

### Manual Testing Checklist
- [ ] Create all 8 voucher types
- [ ] Post vouchers and verify balances
- [ ] Cancel posted vouchers
- [ ] Delete draft vouchers
- [ ] Search and filter functionality
- [ ] View voucher details
- [ ] Update draft vouchers
- [ ] Verify statistics accuracy

## Troubleshooting

### Issue: Voucher not posting
- Check debit/credit balance
- Verify all accounts are active
- Ensure user has permission
- Check for validation errors

### Issue: Balance mismatch
- Verify posting completed successfully
- Check for cancelled vouchers
- Review journal entries
- Run account reconciliation

### Issue: Cannot delete voucher
- Ensure voucher is in draft status
- Check user permissions
- Verify no dependencies exist

## Future Enhancements

### Planned Features
- [ ] Bulk voucher import
- [ ] Voucher templates
- [ ] Recurring vouchers
- [ ] Multi-currency support
- [ ] Advanced approval workflow
- [ ] Email notifications
- [ ] PDF export/print
- [ ] Voucher reversal (instead of cancel)
- [ ] Budget checking before posting
- [ ] Integration with bank feeds

## Support

For issues or questions:
1. Check this documentation
2. Review API error messages
3. Check browser console for errors
4. Verify backend logs
5. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready ✅
