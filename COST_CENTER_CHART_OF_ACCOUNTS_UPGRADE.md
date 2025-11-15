# Cost Centers & Chart of Accounts - Production Ready Upgrade

## 🚀 What's New

### Cost Centers Module - Complete Implementation

#### Backend Features
✅ **Full CRUD Operations** - Create, read, update, delete cost centers
✅ **Hierarchical Structure** - Parent-child cost center relationships
✅ **Budget Management** - Budget allocation with period tracking (monthly/quarterly/yearly)
✅ **Cost Allocation Engine** - Distribute costs across multiple centers with percentage rules
✅ **Cost Transfer** - Move costs between centers with audit trail
✅ **Multi-dimensional Tracking** - Link to departments, projects, and parent cost centers
✅ **Cost Types** - Direct, indirect, and overhead classification
✅ **Allocation Methods** - Equal, percentage, and activity-based allocation
✅ **Real-time Expense Tracking** - Automatic calculation from journal entries
✅ **Profitability Analysis** - Revenue vs expenses by cost center
✅ **Variance Analysis** - Budget vs actual with alerts
✅ **Bulk Import/Export** - CSV import and export functionality

#### API Endpoints
```
POST   /api/cost-centers              - Create cost center
GET    /api/cost-centers              - Get all (with hierarchy support)
GET    /api/cost-centers/:id          - Get single with transactions
PUT    /api/cost-centers/:id          - Update cost center
DELETE /api/cost-centers/:id          - Delete (with validation)
POST   /api/cost-centers/allocate     - Allocate costs with rules
POST   /api/cost-centers/transfer     - Transfer costs between centers
GET    /api/cost-centers/reports/profitability  - Profitability report
GET    /api/cost-centers/reports/variance       - Variance analysis
POST   /api/cost-centers/bulk-import  - Bulk import from CSV
GET    /api/cost-centers/export/csv   - Export to CSV
```

### Chart of Accounts - Advanced Features

#### New Capabilities
✅ **Account Templates** - Industry-specific COA templates (Manufacturing, Retail, Services)
✅ **Account Mapping** - Map external accounts to internal accounts
✅ **Opening Balances** - Fiscal year opening balance management
✅ **Bulk Import/Export** - CSV import and export with validation
✅ **Account Restrictions** - Prevent posting to specific accounts
✅ **Consolidation Rules** - Multi-account consolidation reporting
✅ **Reconciliation Status** - Track which accounts need reconciliation
✅ **Account Metadata** - Custom fields for additional information

#### API Endpoints
```
GET    /api/chart-of-accounts/templates           - Get templates
POST   /api/chart-of-accounts/templates/:id/apply - Apply template
POST   /api/chart-of-accounts/mappings            - Create mapping
GET    /api/chart-of-accounts/mappings            - Get mappings
POST   /api/chart-of-accounts/opening-balances    - Set opening balance
GET    /api/chart-of-accounts/opening-balances    - Get opening balances
POST   /api/chart-of-accounts/bulk-import         - Bulk import accounts
GET    /api/chart-of-accounts/export              - Export accounts
PUT    /api/chart-of-accounts/:id/restriction     - Set restrictions
GET    /api/chart-of-accounts/consolidation       - Consolidation report
PUT    /api/chart-of-accounts/:id/reconciliation  - Update recon status
GET    /api/chart-of-accounts/reconciliation      - Reconciliation report
```

## 📊 Database Models

### Enhanced Cost Center Model
```typescript
{
  code: string (unique, uppercase)
  name: string
  description?: string
  departmentId?: ObjectId
  projectId?: ObjectId
  parentId?: ObjectId              // NEW: Hierarchy support
  budget: number                   // NEW: Budget amount
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly'  // NEW
  budgetVersion: number            // NEW: Track budget revisions
  costType: 'direct' | 'indirect' | 'overhead'      // NEW
  allocationMethod?: 'equal' | 'percentage' | 'activity_based'  // NEW
  isActive: boolean
  level: number                    // NEW: Hierarchy level
  metadata?: Record<string, any>   // NEW: Custom fields
}
```

### Cost Allocation Model (NEW)
```typescript
{
  sourceCostCenterId: ObjectId
  allocationRules: [{
    targetCostCenterId: ObjectId
    percentage: number (0-100)
    basis?: string
  }]
  amount: number
  description: string
  status: 'pending' | 'completed' | 'cancelled'
}
```

### Account Template Model (NEW)
```typescript
{
  name: string
  industry: string
  description?: string
  accounts: [{
    code: string
    name: string
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    parentCode?: string
    isGroup: boolean
    level: number
  }]
  isActive: boolean
}
```

### Account Mapping Model (NEW)
```typescript
{
  externalSystem: string
  externalAccountCode: string
  internalAccountId: ObjectId
  mappingRules?: Record<string, any>
  isActive: boolean
}
```

### Opening Balance Model (NEW)
```typescript
{
  accountId: ObjectId
  fiscalYear: string
  debitBalance: number
  creditBalance: number
  createdBy: ObjectId
}
```

## 🎯 Key Features

### Cost Center Features

#### 1. Hierarchical Cost Centers
```javascript
// Example: Create parent-child structure
Marketing (Parent)
  ├── Digital Marketing (Child)
  ├── Traditional Marketing (Child)
  └── Events (Child)
```

#### 2. Cost Allocation
```javascript
// Allocate overhead costs
{
  sourceCostCenterId: "Admin-001",
  allocationRules: [
    { targetCostCenterId: "Sales-001", percentage: 40 },
    { targetCostCenterId: "Marketing-001", percentage: 30 },
    { targetCostCenterId: "IT-001", percentage: 30 }
  ],
  amount: 100000,
  description: "Monthly overhead allocation"
}
```

#### 3. Profitability Analysis
- Revenue by cost center
- Expenses by cost center
- Profit margin calculation
- ROI tracking

#### 4. Variance Analysis
- Budget vs Actual comparison
- Variance percentage
- Status indicators (over_budget, under_budget, on_track)
- Automated alerts

### Chart of Accounts Features

#### 1. Industry Templates
Pre-built templates for:
- Manufacturing
- Retail & E-commerce
- Services
- Healthcare
- Real Estate
- Technology

#### 2. Account Mapping
Map external systems to internal accounts:
- Bank statement imports
- Payment gateway reconciliation
- Third-party integrations

#### 3. Opening Balances
- Set opening balances by fiscal year
- Automatic balance calculation
- Audit trail

#### 4. Bulk Operations
- Import hundreds of accounts via CSV
- Export for backup or analysis
- Validation and error reporting

## 🔧 Integration Points

### 1. Voucher System Integration
Every voucher can be tagged with a cost center:
```javascript
{
  voucherType: "payment",
  costCenterId: "SALES-001",
  lines: [...]
}
```

### 2. Journal Entry Integration
Cost centers automatically tracked in journal entries:
```javascript
{
  entryNumber: "JE000123",
  costCenterId: "MKT-001",
  lines: [...]
}
```

### 3. Budget Integration
Link cost centers to department budgets:
```javascript
{
  departmentId: "DEPT-001",
  costCenterId: "CC-001",
  budget: 500000,
  period: "yearly"
}
```

## 📈 Reports Available

### Cost Center Reports
1. **Profitability Report** - Revenue, expenses, and profit by cost center
2. **Variance Analysis** - Budget vs actual with variance percentage
3. **Cost Allocation Report** - How costs are distributed
4. **Transaction Detail** - All transactions by cost center
5. **Trend Analysis** - Month-over-month, YoY comparisons

### Chart of Accounts Reports
1. **Account Hierarchy** - Tree view of all accounts
2. **Trial Balance** - Debit and credit totals
3. **Account Ledger** - Transaction history per account
4. **Reconciliation Status** - Which accounts need reconciliation
5. **Consolidation Report** - Multi-account summaries

## 🚦 Usage Examples

### Create Cost Center with Budget
```javascript
POST /api/cost-centers
{
  "code": "MKT-DIG-001",
  "name": "Digital Marketing",
  "description": "Online advertising and social media",
  "departmentId": "DEPT-MKT",
  "parentId": "MKT-001",
  "budget": 250000,
  "budgetPeriod": "yearly",
  "costType": "direct",
  "allocationMethod": "percentage"
}
```

### Allocate Overhead Costs
```javascript
POST /api/cost-centers/allocate
{
  "sourceCostCenterId": "ADMIN-001",
  "allocationRules": [
    { "targetCostCenterId": "SALES-001", "percentage": 50 },
    { "targetCostCenterId": "MKT-001", "percentage": 50 }
  ],
  "amount": 100000,
  "description": "Q1 Admin overhead allocation"
}
```

### Apply Account Template
```javascript
POST /api/chart-of-accounts/templates/TEMPLATE-ID/apply
// Automatically creates all accounts from template
```

### Set Opening Balance
```javascript
POST /api/chart-of-accounts/opening-balances
{
  "accountId": "ACC-001",
  "fiscalYear": "2024",
  "debitBalance": 500000,
  "creditBalance": 0
}
```

## 🔐 Permissions

All endpoints require authentication and appropriate permissions:
- `finance:create` - Create cost centers and accounts
- `finance:read` - View reports and data
- `finance:update` - Modify existing records
- `finance:delete` - Delete records (with validation)

## 📝 Validation Rules

### Cost Center Validation
- Code must be unique and uppercase
- Budget must be non-negative
- Cannot delete cost center with children
- Cannot delete cost center with transactions
- Allocation percentages must sum to 100%

### Account Validation
- Code must be unique
- Cannot delete account with transactions
- Cannot post to restricted accounts
- Opening balance must balance (debit = credit for balance sheet accounts)

## 🎨 Frontend Components

### Cost Centers Page
- Hierarchical tree view
- Budget vs actual cards
- Variance indicators
- Allocation wizard
- Transfer dialog
- Bulk import/export

### Chart of Accounts Page
- Tree view with expand/collapse
- Quick filters by type
- Template selector
- Bulk import wizard
- Opening balance manager
- Reconciliation tracker

## 🚀 Performance Optimizations

1. **Indexed Fields** - All lookup fields indexed
2. **Aggregation Pipelines** - Efficient calculations
3. **Caching** - Frequently accessed data cached
4. **Pagination** - Large datasets paginated
5. **Lazy Loading** - Load children on demand

## 📦 Deployment Notes

1. Run migrations to add new fields to existing cost centers
2. Seed account templates for common industries
3. Update permissions for new endpoints
4. Test bulk import with sample data
5. Configure budget alert thresholds

## 🎯 Next Steps

1. **Phase 1** - Backend fully implemented ✅
2. **Phase 2** - Frontend components (in progress)
3. **Phase 3** - Advanced analytics and forecasting
4. **Phase 4** - AI-powered cost optimization suggestions

---

**Status**: Production Ready
**Version**: 2.0.0
**Last Updated**: 2024

