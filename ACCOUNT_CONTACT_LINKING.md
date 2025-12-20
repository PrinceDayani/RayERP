# Account-Contact Linking Feature

## 🎯 Overview
This feature allows you to automatically create and link contacts (including customers) when creating accounts in the Chart of Accounts. This streamlines the workflow of managing both accounting and customer relationship data.

## ✨ Features

### 1. **Link Account to Contact**
When creating an account, you can optionally link it to a contact by checking the "Link this account to a contact" checkbox.

### 2. **Automatic Contact Creation**
The system automatically creates a contact record with the details you provide, eliminating the need to navigate to the Contacts page separately.

### 3. **Mark as Customer**
You can mark the contact as a customer during account creation, making them immediately available for invoice creation.

### 4. **Bidirectional Linking**
- Account stores reference to Contact (`linkedContact` field)
- Contact can be queried to find associated accounts

## 📋 How to Use

### Step-by-Step Guide

#### 1. Navigate to Chart of Accounts
```
Dashboard → Finance → Chart of Accounts → Create Account
```

#### 2. Enable Contact Linking
- At the top of the form, check the box: **"Link this account to a contact"**
- A blue contact details section will appear

#### 3. Fill Account Details
Fill in the standard account information:
- Account Code (auto-generated if left empty)
- Account Name (required)
- Account Type (asset, liability, equity, revenue, expense)
- Sub Type
- Opening Balance
- Currency
- Description

#### 4. Fill Contact Details
In the blue "Contact Details" section:

**Required Fields:**
- ✓ Contact Name
- ✓ Phone

**Optional Fields:**
- Email
- Company
- Address

#### 5. Mark as Customer (Optional)
- Check the **"Mark as Customer"** checkbox
- A green confirmation message will appear
- This contact will be available in invoice creation

#### 6. Save
- Click "Save" button
- System will:
  1. Create the contact
  2. Mark as customer (if checked)
  3. Create the account
  4. Link them together

## 🔧 Technical Implementation

### Frontend Changes

#### File: `frontend/src/components/finance/AccountCreationForm.tsx`

**New State Variables:**
```typescript
const [linkToContact, setLinkToContact] = useState(false);
const [isCustomer, setIsCustomer] = useState(false);
const [contactData, setContactData] = useState({
  name: '',
  email: '',
  phone: '',
  company: '',
  address: ''
});
```

**Contact Creation Logic:**
```typescript
// Create contact if linkToContact is enabled
let contactId = null;
if (linkToContact) {
  const contactResponse = await fetch(`${API_URL}/api/contacts`, {
    method: 'POST',
    body: JSON.stringify({
      ...contactData,
      isCustomer,
      visibilityLevel: 'personal',
      contactType: isCustomer ? 'client' : 'personal',
      status: 'active'
    })
  });
  
  contactId = contactResult.data._id;
}

// Create account with contact link
const accountPayload = {
  ...formData,
  linkedContact: contactId
};
```

### Backend Changes

#### File: `backend/src/models/Account.ts`

**New Field:**
```typescript
linkedContact?: mongoose.Types.ObjectId;
```

**Schema Definition:**
```typescript
linkedContact: {
  type: Schema.Types.ObjectId,
  ref: 'Contact'
}
```

## 📊 Data Flow

```
User Action: Create Account with Contact Link
    ↓
1. User fills account details
    ↓
2. User checks "Link to contact"
    ↓
3. User fills contact details
    ↓
4. User checks "Mark as Customer" (optional)
    ↓
5. User clicks Save
    ↓
6. Frontend: POST /api/contacts
    ↓
7. Backend: Creates Contact
    ↓
8. Backend: Returns contactId
    ↓
9. Frontend: POST /api/accounts (with linkedContact: contactId)
    ↓
10. Backend: Creates Account with linkedContact reference
    ↓
11. Success: Both records created and linked
```

## 🎨 UI/UX Features

### Visual Indicators

**1. Link Checkbox**
- Located at top of form
- Gray background for visibility
- Clear label: "Link this account to a contact"

**2. Contact Details Section**
- Blue background (`bg-blue-50`)
- Appears only when checkbox is checked
- Clear heading: "Contact Details"
- Helpful description text

**3. Customer Checkbox**
- Located in contact details section
- Label: "Mark as Customer"
- Shows green confirmation when checked

**4. Confirmation Message**
```
✓ This contact will be marked as a customer and will appear in invoice creation.
```

## 💡 Use Cases

### Use Case 1: Customer Account
```
Scenario: Creating an account for a new customer

Steps:
1. Create Account: "ABC Corporation - Receivables"
2. Check "Link to contact"
3. Fill contact:
   - Name: "ABC Corporation"
   - Phone: "+91-9876543210"
   - Email: "billing@abc.com"
   - Company: "ABC Corporation"
4. Check "Mark as Customer"
5. Save

Result:
- Account created: "ABC Corporation - Receivables"
- Contact created: "ABC Corporation" (marked as customer)
- Contact appears in invoice dropdown
- Account linked to contact
```

### Use Case 2: Vendor Account
```
Scenario: Creating an account for a vendor

Steps:
1. Create Account: "XYZ Suppliers - Payables"
2. Check "Link to contact"
3. Fill contact:
   - Name: "XYZ Suppliers"
   - Phone: "+91-9876543210"
   - Email: "sales@xyz.com"
4. Don't check "Mark as Customer"
5. Save

Result:
- Account created: "XYZ Suppliers - Payables"
- Contact created: "XYZ Suppliers" (not a customer)
- Account linked to contact
```

### Use Case 3: Regular Account (No Contact)
```
Scenario: Creating a regular account without contact

Steps:
1. Create Account: "Cash in Hand"
2. Don't check "Link to contact"
3. Fill account details only
4. Save

Result:
- Account created: "Cash in Hand"
- No contact created
- No linking
```

## 🔍 Validation Rules

### Contact Validation
- **Name**: Required when linking to contact
- **Phone**: Required when linking to contact
- **Email**: Optional, but must be valid email format if provided
- **Company**: Optional
- **Address**: Optional

### Account Validation
- **Account Name**: Always required
- **Account Type**: Always required
- **Account Code**: Auto-generated if not provided

## 📈 Benefits

### 1. **Time Saving**
- Create contact and account in one step
- No need to switch between pages
- Reduced data entry time

### 2. **Data Consistency**
- Automatic linking ensures data integrity
- No manual linking errors
- Consistent contact information

### 3. **Improved Workflow**
- Streamlined customer onboarding
- Faster account setup
- Better user experience

### 4. **Flexibility**
- Optional feature (can be skipped)
- Works for customers and non-customers
- Supports all account types

## 🚀 Future Enhancements

### Planned Features
1. **Edit Linked Contact**: Edit contact details from account page
2. **View Linked Accounts**: See all accounts linked to a contact
3. **Bulk Linking**: Link existing accounts to existing contacts
4. **Contact Search**: Search and link to existing contacts instead of creating new
5. **Auto-populate**: Auto-fill contact details from account name
6. **Duplicate Detection**: Warn if similar contact exists

## 🧪 Testing Checklist

### Test Case 1: Create Account with Customer Contact
- [ ] Check "Link to contact"
- [ ] Fill all contact details
- [ ] Check "Mark as Customer"
- [ ] Save successfully
- [ ] Verify contact created
- [ ] Verify contact marked as customer
- [ ] Verify account created
- [ ] Verify account has linkedContact field
- [ ] Verify customer appears in invoice dropdown

### Test Case 2: Create Account with Non-Customer Contact
- [ ] Check "Link to contact"
- [ ] Fill contact details
- [ ] Don't check "Mark as Customer"
- [ ] Save successfully
- [ ] Verify contact created
- [ ] Verify contact NOT marked as customer
- [ ] Verify account created with link

### Test Case 3: Create Account Without Contact
- [ ] Don't check "Link to contact"
- [ ] Fill account details only
- [ ] Save successfully
- [ ] Verify account created
- [ ] Verify no contact created
- [ ] Verify linkedContact field is null

### Test Case 4: Validation Errors
- [ ] Check "Link to contact"
- [ ] Leave name empty → Should show error
- [ ] Leave phone empty → Should show error
- [ ] Enter invalid email → Should show error
- [ ] Fix errors and save → Should succeed

### Test Case 5: UI Behavior
- [ ] Checkbox unchecked → Contact section hidden
- [ ] Checkbox checked → Contact section appears
- [ ] Customer checkbox unchecked → No green message
- [ ] Customer checkbox checked → Green message appears

## 📞 Troubleshooting

### Issue: Contact not created
**Symptoms**: Account created but contact missing

**Solutions**:
1. Check if name and phone were filled
2. Check browser console for errors
3. Verify API endpoint `/api/contacts` is accessible
4. Check backend logs for contact creation errors

### Issue: Contact created but not marked as customer
**Symptoms**: Contact exists but not in invoice dropdown

**Solutions**:
1. Verify "Mark as Customer" was checked
2. Go to Contacts page
3. Edit the contact
4. Check "Customer Status" checkbox
5. Save

### Issue: Account not linked to contact
**Symptoms**: Both created but no link

**Solutions**:
1. Check account's `linkedContact` field in database
2. If null, manually update:
   ```javascript
   db.accounts.updateOne(
     { _id: accountId },
     { $set: { linkedContact: contactId } }
   )
   ```

### Issue: Duplicate contacts created
**Symptoms**: Multiple contacts with same details

**Solutions**:
1. Delete duplicate contacts
2. Future: Implement duplicate detection
3. Use unique phone/email validation

## 📝 API Endpoints Used

### Create Contact
```
POST /api/contacts
Body: {
  name: string (required)
  phone: string (required)
  email?: string
  company?: string
  address?: string
  isCustomer: boolean
  visibilityLevel: 'personal' | 'departmental' | 'universal'
  contactType: 'personal' | 'company' | 'vendor' | 'client' | 'partner'
  status: 'active' | 'inactive' | 'archived'
}
Response: {
  success: true,
  data: { _id, name, email, phone, isCustomer, ... }
}
```

### Create Account
```
POST /api/accounts
Body: {
  name: string (required)
  code?: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' (required)
  linkedContact?: ObjectId
  ... other account fields
}
Response: {
  success: true,
  data: { _id, name, code, type, linkedContact, ... }
}
```

## ✅ Success Criteria

- [x] Checkbox to enable contact linking
- [x] Contact details form appears when enabled
- [x] Customer checkbox in contact section
- [x] Automatic contact creation
- [x] Automatic account creation
- [x] Bidirectional linking
- [x] Validation for required fields
- [x] Success/error messages
- [x] Customer appears in invoice dropdown
- [x] Documentation complete

## 🎉 Summary

This feature provides a seamless way to create accounts and contacts together, especially useful for customer onboarding. By checking a simple checkbox, users can:

1. ✅ Create a contact
2. ✅ Mark it as a customer
3. ✅ Link it to an account
4. ✅ Make it available for invoicing

All in one smooth workflow!

---

**Feature Version**: 1.0.0
**Date**: 2024
**Status**: ✅ Implemented and Documented
