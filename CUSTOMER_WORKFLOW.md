# Customer Management Workflow - RayERP

## 🎯 Overview
This guide explains how to manage customers in RayERP and use them in invoices.

## 📋 How to Add Customers

### Method 1: Mark Existing Contact as Customer
1. Navigate to **Dashboard → Contacts**
2. Find or create a contact
3. Edit the contact
4. Check the **"Customer Status"** checkbox (✓ isCustomer)
5. Save the contact

### Method 2: Create Customer from Invoice Page
1. Navigate to **Dashboard → Finance → Invoices → Create Invoice**
2. Click **"+ Add"** button next to the Customer field
3. Fill in customer details:
   - Name (required)
   - Email
   - Phone (required)
4. Click **"Add Customer"**
5. The customer will be automatically marked as `isCustomer: true`

### Method 3: Create Customer from Contacts Page
1. Navigate to **Dashboard → Contacts**
2. Click **"+ Add Contact"** button
3. Fill in contact details
4. **Important**: Check the **"Customer Status"** checkbox
5. Save the contact

## 🔧 Technical Changes Made

### Backend Changes
1. **New Endpoint**: `GET /api/contacts/customers`
   - Returns only contacts where `isCustomer === true`
   - Filters by visibility level (universal, departmental, personal)
   - Returns active customers only
   - Optimized query with pagination

### Frontend Changes
1. **Invoice Creation Page**: Updated to use `/api/contacts/customers` endpoint
2. **Improved UI**: Better error messages when no customers exist
3. **Customer Display**: Shows company name alongside customer name in dropdown

## 📊 Customer Features

### Contact Model Fields
- `isCustomer`: Boolean flag to mark contact as customer
- `name`: Customer name (required)
- `email`: Customer email
- `phone`: Customer phone (required)
- `company`: Company name
- `contactType`: Type (company, personal, vendor, client, partner)
- `priority`: Priority level (low, medium, high, critical)
- `status`: Status (active, inactive, archived)
- `visibilityLevel`: Who can see this contact (universal, departmental, personal)

### Customer-Specific Operations
1. **Create Invoices**: Select customers when creating sales invoices
2. **Track Sales**: View sales reports by customer
3. **Manage Receivables**: Track outstanding payments from customers
4. **Party Ledger**: Link customers to accounting ledger
5. **Credit Management**: Set credit limits and payment terms

## 🚀 Quick Start Guide

### Step 1: Create Your First Customer
```
1. Go to: Dashboard → Contacts
2. Click: "+ Add Contact"
3. Fill in:
   - Name: "ABC Corporation"
   - Email: "contact@abc.com"
   - Phone: "+1234567890"
   - Company: "ABC Corporation"
   - Contact Type: "Client"
4. ✓ Check "Customer Status" checkbox
5. Click "Save"
```

### Step 2: Create Invoice for Customer
```
1. Go to: Dashboard → Finance → Invoices
2. Click: "Create Invoice"
3. Select: Your customer from dropdown
4. Add line items
5. Click "Create Invoice"
```

## 🔍 Troubleshooting

### Issue: No customers showing in invoice dropdown
**Solution**:
1. Go to Contacts page
2. Verify contacts have `isCustomer` checkbox checked
3. Ensure contacts are marked as "Active" status
4. Check visibility level (must be accessible to you)

### Issue: Customer not appearing after creation
**Solution**:
1. Refresh the invoice page
2. Verify the contact was saved successfully
3. Check that `isCustomer` field is true
4. Ensure contact status is "active"

### Issue: Cannot select customer
**Solution**:
1. Ensure you have at least one contact marked as customer
2. Click "Manage Contacts" to go to contacts page
3. Or click "+ Add" to create a new customer directly

## 📝 API Endpoints

### Get All Customers
```
GET /api/contacts/customers
Response: { success: true, data: [...customers] }
```

### Get All Contacts
```
GET /api/contacts
Response: { success: true, data: [...contacts] }
```

### Create Contact/Customer
```
POST /api/contacts
Body: {
  name: "Customer Name",
  phone: "+1234567890",
  email: "customer@example.com",
  isCustomer: true,
  visibilityLevel: "personal"
}
```

### Update Contact to Customer
```
PUT /api/contacts/:id
Body: { isCustomer: true }
```

## 💡 Best Practices

1. **Always mark customers**: Check the "Customer Status" checkbox for all clients
2. **Use contact types**: Set contactType to "client" for customers
3. **Set visibility**: Use "universal" for company-wide customers
4. **Add company info**: Fill in company name for business customers
5. **Keep active**: Only active customers appear in invoice dropdown
6. **Use tags**: Tag customers for easy filtering (e.g., "VIP", "Regular")

## 🎉 Success!

You can now:
- ✅ Create and manage customers
- ✅ Select customers in invoices
- ✅ Track customer transactions
- ✅ Generate customer reports
- ✅ Manage customer receivables

---

**Need Help?**
- Check the Contacts page for existing contacts
- Use the "+ Add" button in invoice creation for quick customer creation
- Ensure contacts are marked as customers (isCustomer = true)
