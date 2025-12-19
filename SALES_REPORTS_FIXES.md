# Sales Reports - Quick Fixes Implementation

## ✅ Status Update

**Good News**: The `useDebounce` hook already exists! One less critical issue.

## 🔧 Remaining Critical Fixes

### 1. Fix Port Configuration (5 minutes)

Update backend `.env` file:

```env
# backend/.env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### 2. Implement Export Functionality (15 minutes)

Add to `sales-reports/page.tsx`:

```tsx
const handleExport = () => {
  const headers = ['Invoice #', 'Customer', 'Date', 'Total Amount', 'Paid Amount', 'Balance', 'Status'];
  const rows = filteredSales.map(sale => [
    sale.invoiceNumber,
    sale.partyName,
    new Date(sale.invoiceDate).toLocaleDateString(),
    sale.totalAmount.toString(),
    sale.paidAmount.toString(),
    (sale.totalAmount - sale.paidAmount).toString(),
    sale.status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Update the button
<Button onClick={handleExport} className="bg-primary" aria-label="Export sales report">
  <Download className="w-4 h-4 mr-2" />
  Export Report
</Button>
```

### 3. Add Error Boundary (10 minutes)

Create `frontend/src/components/ErrorBoundary.tsx`:

```tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrap the page in `layout.tsx` or directly in the page component.

### 4. Add Loading Skeleton (10 minutes)

Add to `sales-reports/page.tsx`:

```tsx
const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
    <div className="h-96 bg-muted animate-pulse rounded-lg" />
  </div>
);

// Use it
if (loading && sales.length === 0) {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
      <LoadingSkeleton />
    </div>
  );
}
```

## 🎯 Enhanced Features (Optional but Recommended)

### 5. Add Data Visualization (30 minutes)

Install recharts:
```bash
cd frontend
npm install recharts
```

Add chart component:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SalesTrendChart = ({ data }: { data: Sale[] }) => {
  const chartData = data.reduce((acc, sale) => {
    const date = new Date(sale.invoiceDate).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.amount += sale.totalAmount;
    } else {
      acc.push({ date, amount: sale.totalAmount });
    }
    return acc;
  }, [] as { date: string; amount: number }[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

### 6. Add Invoice Details Modal (20 minutes)

```tsx
const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

const InvoiceDetailsModal = ({ invoice, onClose }: { invoice: Sale; onClose: () => void }) => (
  <Dialog open={!!invoice} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Invoice Details - {invoice.invoiceNumber}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Customer</p>
            <p className="text-sm text-muted-foreground">{invoice.partyName}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Invoice Date</p>
            <p className="text-sm text-muted-foreground">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Amount</p>
            <p className="text-sm font-bold">₹{invoice.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// Add click handler to table row
<tr 
  key={sale._id} 
  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
  onClick={() => setSelectedInvoice(sale)}
>
```

### 7. Use Additional API Endpoints (25 minutes)

```tsx
const [summary, setSummary] = useState<any>(null);
const [topCustomers, setTopCustomers] = useState<any[]>([]);

useEffect(() => {
  fetchSummary();
  fetchTopCustomers();
}, [dateRange]);

const fetchSummary = async () => {
  try {
    const params = new URLSearchParams();
    if (dateRange !== 'all') {
      // Add date params
    }
    const data = await apiClient.get(`/api/sales-reports/summary?${params}`);
    setSummary(data.data);
  } catch (err) {
    console.error('Failed to fetch summary:', err);
  }
};

const fetchTopCustomers = async () => {
  try {
    const data = await apiClient.get('/api/sales-reports/top-customers?limit=5');
    setTopCustomers(data.data);
  } catch (err) {
    console.error('Failed to fetch top customers:', err);
  }
};

// Display top customers
<Card>
  <CardHeader>
    <CardTitle>Top Customers</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {topCustomers.map((customer, i) => (
        <div key={i} className="flex justify-between items-center">
          <span className="text-sm">{customer.customer?.name || 'Unknown'}</span>
          <span className="text-sm font-medium">
            ₹{customer.totalPurchases.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

## 📋 Implementation Checklist

### Critical (Do Now)
- [x] ~~Create useDebounce hook~~ (Already exists!)
- [ ] Fix port configuration in backend .env
- [ ] Implement CSV export functionality
- [ ] Add error boundary component
- [ ] Add loading skeleton

### Important (Do This Week)
- [ ] Add data visualization chart
- [ ] Implement invoice details modal
- [ ] Use summary API endpoint
- [ ] Use top customers API endpoint
- [ ] Add advanced filters (customer dropdown)

### Nice to Have (Do Next Week)
- [ ] Add PDF export
- [ ] Implement bulk actions
- [ ] Add print view
- [ ] Add saved filters
- [ ] Real-time updates

## 🧪 Testing Checklist

- [ ] Test with 0 invoices
- [ ] Test with 1000+ invoices
- [ ] Test all status filters
- [ ] Test date range filters
- [ ] Test search functionality
- [ ] Test pagination
- [ ] Test export with large dataset
- [ ] Test on mobile devices
- [ ] Test error scenarios
- [ ] Test with slow network

## 📊 Performance Optimization

### Current Performance
- ✅ Debounced search (500ms)
- ✅ Pagination (50 items)
- ✅ Lean queries
- ✅ Indexed database queries

### Recommended Improvements
```tsx
// 1. Memoize filtered results
const filteredSales = useMemo(() => {
  return sales.filter(sale => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return sale.partyName?.toLowerCase().includes(search) ||
           sale.invoiceNumber?.toLowerCase().includes(search);
  });
}, [sales, debouncedSearch]);

// 2. Memoize calculations
const stats = useMemo(() => ({
  totalRevenue: filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
  totalPaid: filteredSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0),
  totalPending: 0, // calculated below
  avgSale: 0 // calculated below
}), [filteredSales]);

// 3. Use React.memo for table rows
const SalesRow = React.memo(({ sale, onView }: { sale: Sale; onView: (sale: Sale) => void }) => (
  <tr onClick={() => onView(sale)} className="...">
    {/* row content */}
  </tr>
));
```

## 🔒 Security Enhancements

```tsx
// 1. Sanitize search input
const sanitizeInput = (input: string) => {
  return input.replace(/[<>]/g, '');
};

// 2. Add rate limiting on frontend
const [requestCount, setRequestCount] = useState(0);
const [lastRequestTime, setLastRequestTime] = useState(Date.now());

const rateLimitedFetch = async () => {
  const now = Date.now();
  if (now - lastRequestTime < 1000 && requestCount >= 5) {
    console.warn('Rate limit exceeded');
    return;
  }
  // proceed with fetch
};

// 3. Add CSRF token for exports
const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
};
```

## 🎯 Quick Win: 30-Minute MVP

If you only have 30 minutes, implement these in order:

1. **Fix port config** (2 min)
2. **Add CSV export** (10 min)
3. **Add loading skeleton** (8 min)
4. **Add error boundary** (10 min)

This will make the feature production-ready for basic use.

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify MongoDB connection
4. Test API endpoints with Postman
5. Check CORS configuration

---

**Total Implementation Time**: 
- Critical fixes: ~40 minutes
- Enhanced features: ~2 hours
- Full production-ready: ~1 day

**Priority**: Start with critical fixes, then add enhanced features incrementally.
