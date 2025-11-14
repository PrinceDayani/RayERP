# Voucher System - Testing Checklist

## 🧪 Complete Testing Guide

Use this checklist to verify all voucher system functionality before production deployment.

## ✅ Pre-Testing Setup

- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] MongoDB is connected and accessible
- [ ] Test user account created with appropriate permissions
- [ ] Chart of Accounts has test accounts created
- [ ] Browser console is open for debugging

## 📋 Functional Testing

### 1. Payment Voucher (PAY)

#### Create Payment Voucher
- [ ] Navigate to Finance → Vouchers
- [ ] Click "Create Voucher"
- [ ] Select Type: Payment
- [ ] Fill in date (today's date)
- [ ] Enter party name: "Test Vendor"
- [ ] Select payment mode: Bank
- [ ] Enter narration: "Test payment for supplies"
- [ ] Add Line 1: Expense Account - Debit: 10000
- [ ] Add Line 2: Bank Account - Credit: 10000
- [ ] Verify totals match (₹10,000 = ₹10,000)
- [ ] Click "Create Voucher"
- [ ] Verify success toast appears
- [ ] Verify voucher appears in list with status "Draft"
- [ ] Verify voucher number format: PAY24XXXXXX

#### Post Payment Voucher
- [ ] Find the created payment voucher
- [ ] Click eye icon to view details
- [ ] Verify all details are correct
- [ ] Click "Post Voucher"
- [ ] Confirm the action
- [ ] Verify success toast
- [ ] Verify status changed to "Posted"
- [ ] Check account balances updated correctly
- [ ] Verify journal entry was created

#### Cancel Payment Voucher
- [ ] Find a posted payment voucher
- [ ] Click cancel button (X icon)
- [ ] Enter cancellation reason: "Test cancellation"
- [ ] Confirm cancellation
- [ ] Verify status changed to "Cancelled"
- [ ] Verify account balances reversed
- [ ] Verify cancellation reason recorded

### 2. Receipt Voucher (REC)

#### Create Receipt Voucher
- [ ] Click "Create Voucher"
- [ ] Select Type: Receipt
- [ ] Fill in date
- [ ] Enter party name: "Test Customer"
- [ ] Select payment mode: UPI
- [ ] Enter narration: "Payment received from customer"
- [ ] Add Line 1: Bank Account - Debit: 15000
- [ ] Add Line 2: Customer Account - Credit: 15000
- [ ] Verify totals match
- [ ] Create and verify success
- [ ] Verify voucher number: REC24XXXXXX

#### Test with Cheque
- [ ] Create another receipt voucher
- [ ] Select payment mode: Cheque
- [ ] Verify cheque fields appear
- [ ] Enter cheque number: "123456"
- [ ] Enter cheque date
- [ ] Complete and create voucher
- [ ] Verify cheque details saved

### 3. Contra Voucher (CON)

#### Create Contra Voucher
- [ ] Click "Create Voucher"
- [ ] Select Type: Contra
- [ ] Enter narration: "Cash deposit to bank"
- [ ] Add Line 1: Bank Account - Debit: 50000
- [ ] Add Line 2: Cash Account - Credit: 50000
- [ ] Create and verify
- [ ] Verify voucher number: CON24XXXXXX
- [ ] Post and verify both accounts updated

### 4. Sales Voucher (SAL)

#### Create Sales Voucher
- [ ] Click "Create Voucher"
- [ ] Select Type: Sales
- [ ] Verify invoice fields appear
- [ ] Enter invoice number: "INV-001"
- [ ] Enter invoice date
- [ ] Enter party name: "ABC Corp"
- [ ] Enter narration: "Sale of products"
- [ ] Add Line 1: Customer Account - Debit: 59000
- [ ] Add Line 2: Sales Revenue - Credit: 50000
- [ ] Add Line 3: GST Output - Credit: 9000
- [ ] Verify totals: 59000 = 59000
- [ ] Create and verify
- [ ] Verify voucher number: SAL24XXXXXX

### 5. Purchase Voucher (PUR)

#### Create Purchase Voucher
- [ ] Click "Create Voucher"
- [ ] Select Type: Purchase
- [ ] Enter invoice number: "PINV-001"
- [ ] Enter invoice date
- [ ] Enter party name: "XYZ Suppliers"
- [ ] Enter narration: "Purchase of inventory"
- [ ] Add Line 1: Purchase Expense - Debit: 50000
- [ ] Add Line 2: GST Input - Debit: 9000
- [ ] Add Line 3: Vendor Account - Credit: 59000
- [ ] Create and verify
- [ ] Verify voucher number: PUR24XXXXXX

### 6. Journal Voucher (JOU)

#### Create Journal Voucher
- [ ] Click "Create Voucher"
- [ ] Select Type: Journal
- [ ] Enter narration: "Monthly depreciation"
- [ ] Add Line 1: Depreciation Expense - Debit: 25000
- [ ] Add Line 2: Accumulated Depreciation - Credit: 25000
- [ ] Create and verify
- [ ] Verify voucher number: JOU24XXXXXX
- [ ] Post and verify accounts updated

### 7. Debit Note (DN)

#### Create Debit Note
- [ ] Click "Create Voucher"
- [ ] Select Type: Debit Note
- [ ] Enter invoice number: "DN-001"
- [ ] Enter party name: "Vendor Name"
- [ ] Enter narration: "Return of defective goods"
- [ ] Add Line 1: Vendor Account - Debit: 10000
- [ ] Add Line 2: Purchase Returns - Credit: 10000
- [ ] Create and verify
- [ ] Verify voucher number: DN24XXXXXX

### 8. Credit Note (CN)

#### Create Credit Note
- [ ] Click "Create Voucher"
- [ ] Select Type: Credit Note
- [ ] Enter invoice number: "CN-001"
- [ ] Enter party name: "Customer Name"
- [ ] Enter narration: "Sales return from customer"
- [ ] Add Line 1: Sales Returns - Debit: 10000
- [ ] Add Line 2: Customer Account - Credit: 10000
- [ ] Create and verify
- [ ] Verify voucher number: CN24XXXXXX

## 🔍 Search & Filter Testing

### Search Functionality
- [ ] Enter voucher number in search box
- [ ] Verify correct voucher appears
- [ ] Search by party name
- [ ] Verify results filtered correctly
- [ ] Search by narration keyword
- [ ] Verify search works
- [ ] Clear search and verify all vouchers return

### Filter by Type
- [ ] Select "Payment" from type filter
- [ ] Verify only payment vouchers shown
- [ ] Test each voucher type filter
- [ ] Select "All Types"
- [ ] Verify all vouchers return

### Filter by Status
- [ ] Select "Draft" status
- [ ] Verify only draft vouchers shown
- [ ] Select "Posted" status
- [ ] Verify only posted vouchers shown
- [ ] Select "Cancelled" status
- [ ] Verify only cancelled vouchers shown
- [ ] Select "All Status"
- [ ] Verify all vouchers return

### Combined Filters
- [ ] Select Type: Payment + Status: Posted
- [ ] Verify correct results
- [ ] Add search term
- [ ] Verify all filters work together
- [ ] Clear all filters
- [ ] Verify reset works

## 📊 Statistics Testing

### Dashboard Cards
- [ ] Verify 8 voucher type cards displayed
- [ ] Check Payment card shows correct count
- [ ] Check Receipt card shows correct amount
- [ ] Verify all cards show accurate data
- [ ] Click on a card
- [ ] Verify filter applied automatically
- [ ] Check "posted" count is accurate

### Real-time Updates
- [ ] Note current statistics
- [ ] Create a new voucher
- [ ] Verify count increased
- [ ] Post the voucher
- [ ] Verify posted count increased
- [ ] Verify amount updated
- [ ] Cancel a voucher
- [ ] Verify cancelled count increased

## ✏️ Edit & Update Testing

### Update Draft Voucher
- [ ] Create a draft voucher
- [ ] Click to view details
- [ ] Note: Edit functionality (if implemented)
- [ ] Try to edit posted voucher
- [ ] Verify error message appears
- [ ] Verify posted vouchers cannot be edited

### Delete Draft Voucher
- [ ] Create a draft voucher
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify voucher removed from list
- [ ] Try to delete posted voucher
- [ ] Verify error message
- [ ] Verify posted vouchers cannot be deleted

## 🔐 Security Testing

### Authentication
- [ ] Logout from application
- [ ] Try to access vouchers page
- [ ] Verify redirect to login
- [ ] Login again
- [ ] Verify access granted

### Authorization (if RBAC implemented)
- [ ] Test with EMPLOYEE role
- [ ] Verify create permission
- [ ] Verify cannot post
- [ ] Test with MANAGER role
- [ ] Verify can post
- [ ] Test with ADMIN role
- [ ] Verify full access

## ⚠️ Error Handling Testing

### Validation Errors
- [ ] Try to create voucher with debit ≠ credit
- [ ] Verify error message shown
- [ ] Try to create without narration
- [ ] Verify validation error
- [ ] Try to create without lines
- [ ] Verify error message
- [ ] Try to create with invalid account
- [ ] Verify error handling

### Network Errors
- [ ] Stop backend server
- [ ] Try to create voucher
- [ ] Verify error toast appears
- [ ] Restart backend
- [ ] Verify functionality restored

### Edge Cases
- [ ] Create voucher with 10+ lines
- [ ] Verify all lines saved
- [ ] Create voucher with very large amount
- [ ] Verify number formatting
- [ ] Create voucher with decimal amounts (0.01)
- [ ] Verify precision maintained
- [ ] Create voucher with zero amount lines
- [ ] Verify validation

## 📱 Responsive Design Testing

### Desktop (1920x1080)
- [ ] Verify layout looks good
- [ ] Check all buttons accessible
- [ ] Verify tables display properly
- [ ] Check forms are usable

### Tablet (768x1024)
- [ ] Verify responsive layout
- [ ] Check cards stack properly
- [ ] Verify forms are usable
- [ ] Check table scrolls horizontally

### Mobile (375x667)
- [ ] Verify mobile layout
- [ ] Check cards stack vertically
- [ ] Verify forms are usable
- [ ] Check buttons are tappable
- [ ] Verify table scrolls

## 🌐 Browser Compatibility

### Chrome
- [ ] Test all functionality
- [ ] Verify UI renders correctly
- [ ] Check console for errors

### Firefox
- [ ] Test all functionality
- [ ] Verify UI renders correctly
- [ ] Check console for errors

### Safari
- [ ] Test all functionality
- [ ] Verify UI renders correctly
- [ ] Check console for errors

### Edge
- [ ] Test all functionality
- [ ] Verify UI renders correctly
- [ ] Check console for errors

## 🚀 Performance Testing

### Load Time
- [ ] Measure initial page load time
- [ ] Should be < 2 seconds
- [ ] Check voucher list load time
- [ ] Should be < 1 second

### Large Dataset
- [ ] Create 100+ vouchers (use script if available)
- [ ] Test list performance
- [ ] Verify pagination works
- [ ] Test search performance
- [ ] Test filter performance

### Concurrent Operations
- [ ] Open multiple browser tabs
- [ ] Create vouchers in different tabs
- [ ] Verify no conflicts
- [ ] Verify data consistency

## 📄 Data Integrity Testing

### Account Balance Verification
- [ ] Note account balance before posting
- [ ] Post a voucher
- [ ] Verify balance updated correctly
- [ ] Cancel the voucher
- [ ] Verify balance reversed correctly
- [ ] Check multiple accounts
- [ ] Verify all balances accurate

### Journal Entry Integration
- [ ] Post a voucher
- [ ] Navigate to Journal Entries
- [ ] Verify journal entry created
- [ ] Verify entry number format: JE-{voucherNumber}
- [ ] Verify all line items match
- [ ] Verify amounts match

### Audit Trail
- [ ] Create a voucher
- [ ] Note created by and timestamp
- [ ] Post the voucher
- [ ] Verify approved by recorded
- [ ] Verify approved at timestamp
- [ ] Cancel the voucher
- [ ] Verify cancelled by recorded
- [ ] Verify cancellation reason saved

## 🎯 User Experience Testing

### Form Usability
- [ ] Tab through form fields
- [ ] Verify tab order is logical
- [ ] Test keyboard shortcuts (if any)
- [ ] Verify dropdown search works
- [ ] Test add/remove line buttons
- [ ] Verify form resets after creation

### Visual Feedback
- [ ] Verify loading states shown
- [ ] Check success toasts appear
- [ ] Verify error toasts appear
- [ ] Check status badges are clear
- [ ] Verify color coding is consistent

### Help & Guidance
- [ ] Check for helpful placeholder text
- [ ] Verify field labels are clear
- [ ] Check for validation messages
- [ ] Verify error messages are helpful

## 📊 Reporting Integration

### Voucher Reports (if implemented)
- [ ] Generate voucher summary report
- [ ] Verify data accuracy
- [ ] Test date range filtering
- [ ] Test export functionality

### Account Ledger
- [ ] Open account ledger
- [ ] Verify voucher transactions appear
- [ ] Check transaction details
- [ ] Verify amounts are correct

## 🔄 Workflow Testing

### Complete Workflow
- [ ] Create payment voucher (Draft)
- [ ] Review details
- [ ] Post voucher (Posted)
- [ ] Verify in account ledger
- [ ] Verify in journal entries
- [ ] Cancel if needed (Cancelled)
- [ ] Verify reversal in ledger

### Multi-User Workflow (if applicable)
- [ ] User A creates voucher
- [ ] User B reviews and posts
- [ ] Verify audit trail shows both users
- [ ] Test permission boundaries

## 📝 Documentation Verification

### User Documentation
- [ ] Follow Quick Start Guide
- [ ] Verify all steps work
- [ ] Check examples are accurate
- [ ] Test troubleshooting solutions

### API Documentation
- [ ] Test API endpoints with Postman
- [ ] Verify request/response formats
- [ ] Check error responses
- [ ] Verify authentication works

## ✅ Final Checklist

### Before Production
- [ ] All functional tests passed
- [ ] All error handling tested
- [ ] Performance is acceptable
- [ ] Security measures verified
- [ ] Documentation is complete
- [ ] User training completed
- [ ] Backup procedures in place
- [ ] Rollback plan prepared

### Production Deployment
- [ ] Database backup taken
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Support team briefed

### Post-Deployment
- [ ] Smoke test in production
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify user access
- [ ] Test critical workflows
- [ ] Collect user feedback

## 🐛 Bug Tracking

### Issues Found
| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 |       |          |        |       |
| 2 |       |          |        |       |
| 3 |       |          |        |       |

### Test Results Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___
- Pass Rate: ___%

## 📞 Support Contacts

- **Technical Lead**: ___________
- **QA Lead**: ___________
- **Product Owner**: ___________
- **Support Team**: ___________

## 📅 Testing Schedule

- **Start Date**: ___________
- **End Date**: ___________
- **Sign-off Date**: ___________
- **Production Date**: ___________

---

**Tester Name**: ___________  
**Date**: ___________  
**Signature**: ___________

**Status**: ⬜ In Progress | ⬜ Completed | ⬜ Approved
