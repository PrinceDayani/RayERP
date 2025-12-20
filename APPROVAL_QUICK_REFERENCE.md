# Approval Workflow - Quick Reference Card

## 🚀 Quick Start

### Backend API Endpoints
```
POST   /api/approvals              Create approval
GET    /api/approvals/pending      Get pending
GET    /api/approvals/stats        Get statistics
GET    /api/approvals/history      Get history
GET    /api/approvals/:id          Get by ID
GET    /api/approvals              Get all (with filters)
POST   /api/approvals/:id/approve  Approve
POST   /api/approvals/:id/reject   Reject
```

### Frontend API Client
```typescript
import { approvalsAPI } from '@/lib/api/approvalsAPI';

// Get pending
const approvals = await approvalsAPI.getPending();

// Approve
await approvalsAPI.approve(id, 'Approved');

// Reject
await approvalsAPI.reject(id, 'Reason');

// Get stats
const stats = await approvalsAPI.getStats();
```

---

## 💡 Common Use Cases

### 1. Create Approval in Your Controller
```typescript
import { createApprovalRequest, requiresApproval } from '../utils/approvalHelper';

if (requiresApproval(payment.amount)) {
  await createApprovalRequest(
    'PAYMENT',
    payment._id,
    `Payment to ${vendor}`,
    payment.amount,
    req.user.id,
    payment.description
  );
}
```

### 2. Check Approval Status
```typescript
import { getApprovalStatus } from '../utils/approvalHelper';

const status = await getApprovalStatus('PAYMENT', paymentId);
// Returns: 'PENDING' | 'APPROVED' | 'REJECTED' | null
```

### 3. Display Approval in UI
```typescript
{payment.status === 'PENDING_APPROVAL' && (
  <Badge variant="warning">
    Pending Approval
  </Badge>
)}
```

---

## 📊 Approval Levels

| Amount | Levels | Approvers |
|--------|--------|-----------|
| < ₹50K | 1 | Manager |
| ₹50K - ₹200K | 2 | Manager → Finance Manager |
| > ₹200K | 3 | Manager → Finance Manager → CFO |

---

## 🎨 Status Colors

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
```

---

## 🔧 Helper Functions

```typescript
// Determine if approval needed
requiresApproval(amount: number, threshold = 10000): boolean

// Get approval levels for amount
determineApprovalLevels(amount: number): ApprovalLevel[]

// Get priority
determinePriority(amount: number): 'HIGH' | 'MEDIUM' | 'LOW'

// Create approval
createApprovalRequest(
  entityType: string,
  entityId: ObjectId,
  title: string,
  amount: number,
  requestedBy: ObjectId,
  description?: string,
  metadata?: any
): Promise<ApprovalRequest>

// Check if user can approve
canUserApprove(approvalId: ObjectId, userRole: string): Promise<boolean>
```

---

## 📝 Model Fields

### ApprovalRequest
```typescript
{
  entityType: 'JOURNAL' | 'PAYMENT' | 'INVOICE' | 'EXPENSE' | 'VOUCHER'
  entityId: ObjectId
  title: string
  description?: string
  amount: number
  requestedBy: ObjectId
  currentLevel: number
  totalLevels: number
  approvalLevels: ApprovalLevel[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  metadata?: any
  completedAt?: Date
}
```

### ApprovalLevel
```typescript
{
  level: number
  approverRole: string
  approverIds: ObjectId[]
  amountThreshold: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED'
  approvedBy?: ObjectId
  approvedAt?: Date
  comments?: string
}
```

---

## 🧪 Testing Commands

### Create Test Approval
```bash
curl -X POST http://localhost:5000/api/approvals \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "PAYMENT",
    "entityId": "507f1f77bcf86cd799439011",
    "title": "Test Payment",
    "amount": 75000
  }'
```

### Get Pending
```bash
curl http://localhost:5000/api/approvals/pending \
  -H "Authorization: Bearer TOKEN"
```

### Approve
```bash
curl -X POST http://localhost:5000/api/approvals/ID/approve \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments": "Approved"}'
```

### Reject
```bash
curl -X POST http://localhost:5000/api/approvals/ID/reject \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient docs"}'
```

---

## 🔐 Security Checklist

- [x] Authentication required on all routes
- [x] Role validation
- [x] Transaction locking
- [x] Approval chain validation
- [x] Mandatory rejection reasons
- [x] Audit trail
- [x] Input validation

---

## 📱 Frontend Components

### Import Required Components
```typescript
import { approvalsAPI } from '@/lib/api/approvalsAPI';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
```

### Basic Approval List
```typescript
const [approvals, setApprovals] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadApprovals();
}, []);

const loadApprovals = async () => {
  try {
    setLoading(true);
    const data = await approvalsAPI.getPending();
    setApprovals(data);
  } catch (error) {
    toast({ title: 'Error', description: error.message });
  } finally {
    setLoading(false);
  }
};
```

---

## 🎯 Integration Steps

1. **Add to Model**
   ```typescript
   status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'] }
   approvalId: { type: ObjectId, ref: 'ApprovalRequest' }
   ```

2. **Check in Controller**
   ```typescript
   if (requiresApproval(amount)) {
     entity.status = 'PENDING_APPROVAL';
     await createApprovalRequest(...);
   }
   ```

3. **Display in UI**
   ```typescript
   {status === 'PENDING_APPROVAL' && <Badge>Pending</Badge>}
   ```

4. **Handle Completion**
   ```typescript
   // Update entity when approved/rejected
   await Entity.findByIdAndUpdate(id, { status: 'APPROVED' });
   ```

---

## 📞 Support

- **Documentation**: See `APPROVAL_WORKFLOW_COMPLETE.md`
- **Integration Guide**: See `APPROVAL_INTEGRATION_GUIDE.md`
- **Summary**: See `APPROVAL_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Status: PRODUCTION READY

All features implemented and tested.
Ready for deployment.

**Version**: 1.0.0  
**Last Updated**: 2024
