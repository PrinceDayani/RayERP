# Approval Workflow Integration Guide

## How to Add Approval Workflow to Existing Entities

This guide shows how to integrate the approval workflow system with your existing journal entries, payments, invoices, expenses, and vouchers.

---

## Step 1: Import the Helper

```typescript
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';
```

---

## Step 2: Modify Your Create Controller

### Example: Payment Controller

**Before:**
```typescript
export const createPayment = async (req: Request, res: Response) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

**After:**
```typescript
export const createPayment = async (req: Request, res: Response) => {
  try {
    const payment = new Payment(req.body);
    
    // Check if approval required
    if (requiresApproval(payment.amount)) {
      payment.status = 'PENDING_APPROVAL'; // Add this status to your model
      await payment.save();
      
      // Create approval request
      const approval = await createApprovalRequest(
        'PAYMENT',
        payment._id,
        `Payment to ${payment.vendorName}`,
        payment.amount,
        req.user.id,
        payment.description,
        {
          vendorId: payment.vendorId,
          invoiceNumber: payment.invoiceNumber
        }
      );
      
      return res.status(201).json({
        success: true,
        data: payment,
        approval,
        message: 'Payment created and sent for approval'
      });
    }
    
    // No approval needed
    payment.status = 'APPROVED';
    await payment.save();
    
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

---

## Step 3: Update Your Model Schema

Add approval-related fields to your entity model:

```typescript
// In your Payment/Invoice/Journal model
const paymentSchema = new Schema({
  // ... existing fields
  
  // Add these fields
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID'],
    default: 'DRAFT'
  },
  approvalId: {
    type: Schema.Types.ObjectId,
    ref: 'ApprovalRequest'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String
});
```

---

## Step 4: Handle Approval Completion

Create a webhook or listener to update entity status when approved:

```typescript
// In approvalController.ts - Add after approval/rejection

// After successful approval
if (allApproved) {
  approval.status = 'APPROVED';
  approval.completedAt = new Date();
  
  // Update the entity
  await updateEntityStatus(approval.entityType, approval.entityId, 'APPROVED', req.user.id);
}

// Helper function
const updateEntityStatus = async (
  entityType: string,
  entityId: mongoose.Types.ObjectId,
  status: string,
  approvedBy: mongoose.Types.ObjectId
) => {
  let Model;
  
  switch (entityType) {
    case 'PAYMENT':
      Model = require('../models/Payment').default;
      break;
    case 'INVOICE':
      Model = require('../models/Invoice').default;
      break;
    case 'JOURNAL':
      Model = require('../models/JournalEntry').default;
      break;
    case 'EXPENSE':
      Model = require('../models/Expense').default;
      break;
    case 'VOUCHER':
      Model = require('../models/Voucher').default;
      break;
    default:
      return;
  }
  
  await Model.findByIdAndUpdate(entityId, {
    status,
    approvedBy,
    approvedAt: new Date()
  });
};
```

---

## Step 5: Add Approval Status to List Views

### Backend - Add approval info to queries

```typescript
export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find()
      .populate('approvalId')
      .populate('approvedBy', 'name email');
    
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Frontend - Display approval status

```typescript
{
  key: 'status',
  header: 'Status',
  render: (value, row) => {
    if (value === 'PENDING_APPROVAL') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="warning">Pending Approval</Badge>
          {row.approvalId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => viewApproval(row.approvalId)}
            >
              View
            </Button>
          )}
        </div>
      );
    }
    return <Badge>{value}</Badge>;
  }
}
```

---

## Step 6: Add Approval Threshold Configuration

Create a settings model for configurable thresholds:

```typescript
// models/ApprovalSettings.ts
const approvalSettingsSchema = new Schema({
  entityType: {
    type: String,
    enum: ['PAYMENT', 'INVOICE', 'JOURNAL', 'EXPENSE', 'VOUCHER'],
    required: true,
    unique: true
  },
  enabled: { type: Boolean, default: true },
  thresholds: [{
    level: Number,
    role: String,
    minAmount: Number,
    maxAmount: Number
  }],
  autoApproveUnder: { type: Number, default: 10000 }
});
```

---

## Step 7: Add Notification Integration

```typescript
// After creating approval request
import { sendNotification } from '../utils/notifications';

// Notify approvers
const approvers = await User.find({ role: currentLevel.approverRole });
approvers.forEach(approver => {
  sendNotification({
    userId: approver._id,
    type: 'APPROVAL_REQUEST',
    title: 'New Approval Request',
    message: `${approval.title} requires your approval`,
    link: `/dashboard/finance/approvals`,
    metadata: { approvalId: approval._id }
  });
});
```

---

## Complete Integration Example

### Payment Controller with Full Integration

```typescript
import { Request, Response } from 'express';
import Payment from '../models/Payment';
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';
import { sendNotification } from '../utils/notifications';
import mongoose from 'mongoose';

export const createPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.user) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const payment = new Payment({
      ...req.body,
      createdBy: req.user.id
    });
    
    // Check if approval required
    if (requiresApproval(payment.amount, 10000)) {
      payment.status = 'PENDING_APPROVAL';
      await payment.save({ session });
      
      // Create approval request
      const approval = await createApprovalRequest(
        'PAYMENT',
        payment._id,
        `Payment to ${payment.vendorName}`,
        payment.amount,
        new mongoose.Types.ObjectId(req.user.id),
        payment.description,
        {
          vendorId: payment.vendorId,
          invoiceNumber: payment.invoiceNumber,
          dueDate: payment.dueDate
        }
      );
      
      // Link approval to payment
      payment.approvalId = approval._id;
      await payment.save({ session });
      
      // Notify approvers
      const User = require('../models/User').default;
      const currentLevel = approval.approvalLevels[0];
      const approvers = await User.find({ 'role.name': currentLevel.approverRole });
      
      for (const approver of approvers) {
        await sendNotification({
          userId: approver._id,
          type: 'APPROVAL_REQUEST',
          title: 'New Payment Approval',
          message: `Payment of ₹${payment.amount.toLocaleString()} requires your approval`,
          link: `/dashboard/finance/approvals`,
          metadata: { approvalId: approval._id, paymentId: payment._id }
        });
      }
      
      await session.commitTransaction();
      
      return res.status(201).json({
        success: true,
        data: payment,
        approval,
        message: 'Payment created and sent for approval'
      });
    }
    
    // No approval needed - auto approve
    payment.status = 'APPROVED';
    payment.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    payment.approvedAt = new Date();
    await payment.save({ session });
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created and auto-approved'
    });
    
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Update entity when approval completes
export const handleApprovalComplete = async (
  approvalId: mongoose.Types.ObjectId,
  status: 'APPROVED' | 'REJECTED',
  userId: mongoose.Types.ObjectId,
  reason?: string
) => {
  const approval = await ApprovalRequest.findById(approvalId);
  if (!approval) return;
  
  const payment = await Payment.findById(approval.entityId);
  if (!payment) return;
  
  if (status === 'APPROVED') {
    payment.status = 'APPROVED';
    payment.approvedBy = userId;
    payment.approvedAt = new Date();
  } else {
    payment.status = 'REJECTED';
    payment.rejectionReason = reason;
  }
  
  await payment.save();
  
  // Notify requester
  await sendNotification({
    userId: approval.requestedBy,
    type: status === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
    title: `Payment ${status}`,
    message: `Your payment request has been ${status.toLowerCase()}`,
    link: `/dashboard/finance/payments/${payment._id}`,
    metadata: { paymentId: payment._id, approvalId: approval._id }
  });
};
```

---

## Testing Your Integration

### 1. Test Small Amount (No Approval)
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "Test Vendor",
    "amount": 5000,
    "description": "Small payment"
  }'
```

Expected: Payment created with status "APPROVED"

### 2. Test Medium Amount (Approval Required)
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "Test Vendor",
    "amount": 75000,
    "description": "Medium payment"
  }'
```

Expected: Payment created with status "PENDING_APPROVAL" and approval request created

### 3. Test Approval Flow
```bash
# Get pending approvals
curl http://localhost:5000/api/approvals/pending \
  -H "Authorization: Bearer APPROVER_TOKEN"

# Approve
curl -X POST http://localhost:5000/api/approvals/APPROVAL_ID/approve \
  -H "Authorization: Bearer APPROVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments": "Approved"}'

# Verify payment status updated
curl http://localhost:5000/api/payments/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Checklist for Each Entity

- [ ] Add `status` field with PENDING_APPROVAL option
- [ ] Add `approvalId` reference field
- [ ] Add `approvedBy` and `approvedAt` fields
- [ ] Modify create controller to check approval threshold
- [ ] Create approval request when needed
- [ ] Add approval status to list views
- [ ] Add approval link/button in UI
- [ ] Handle approval completion webhook
- [ ] Add notification integration
- [ ] Test approval flow end-to-end

---

## Summary

The approval workflow system is now ready to be integrated with any financial entity in your system. Follow the steps above for each entity type (Payment, Invoice, Journal Entry, Expense, Voucher) to enable approval workflows.

**Key Points:**
- Approval is automatic for amounts below threshold
- Multi-level approval for larger amounts
- Transaction-safe operations
- Notification integration ready
- Audit trail maintained
- Status tracking throughout lifecycle
