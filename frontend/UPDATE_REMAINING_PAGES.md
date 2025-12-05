# Update Remaining Budget [id] Pages

## Pages to Update

### 1. `/budgets/[id]/variances/page.tsx`
### 2. `/budgets/[id]/comments/page.tsx`
### 3. `/budgets/[id]/revisions/page.tsx`

## Required Changes for Each Page

### Step 1: Update Imports
```typescript
// Add
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
```

### Step 2: Replace State with URL Param
```typescript
// Remove
const [budgetId, setBudgetId] = useState('');

// Add
const params = useParams();
const budgetId = params.id as string;
```

### Step 3: Auto-fetch on Mount
```typescript
// Replace manual search with useEffect
useEffect(() => {
  if (budgetId) {
    fetchBudgetAndData();
  }
}, [budgetId]);

const fetchBudgetAndData = async () => {
  setLoading(true);
  try {
    const [budgetRes, dataRes] = await Promise.all([
      api.get(`/budgets/${budgetId}`),
      // ... specific API call
    ]);
    setBudgetName(budgetRes.data.data.budgetName);
    // ... set data
  } catch (err) {
    console.error('Failed to fetch data:', err);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Update Header
```typescript
<div className="flex items-center gap-4">
  <Link href={`/dashboard/budgets/${budgetId}`}>
    <Button variant="ghost" size="icon">
      <ArrowLeft className="w-4 h-4" />
    </Button>
  </Link>
  <div>
    <h1 className="text-3xl font-bold">[Module Name]: {budgetName}</h1>
    <p className="text-gray-600 mt-1">[Description]</p>
  </div>
</div>
```

### Step 5: Remove Search Card
```typescript
// Remove entire Card with search input
<Card>
  <CardHeader>
    <CardTitle>Select Budget</CardTitle>
    ...
  </CardHeader>
  <CardContent>
    <Input ... /> // Remove this
    <Button onClick={handleSearch}>Search</Button> // Remove this
  </CardContent>
</Card>
```

### Step 6: Remove Conditional Rendering
```typescript
// Remove
{budgetName && (
  // content
)}

// Keep just the content (it will always render after loading)
```

## Specific Updates

### Variances Page
- Module name: "Variance Analysis"
- API: `budgetVarianceAPI.getVariances(budgetId)`
- Description: "Compare actual vs budgeted spending"

### Comments Page
- Module name: "Collaboration & Comments"
- API: `budgetCommentAPI.getComments(budgetId)`
- Description: "Team collaboration with comments and reactions"

### Revisions Page
- Module name: "Version History"
- API: `budgetRevisionAPI.getVersions(budgetId)`
- Description: "Track budget changes and restore previous versions"

## Testing Checklist

For each updated page:
- [ ] Navigate to `/budgets/[id]/[module]`
- [ ] Verify budget name loads in header
- [ ] Verify data loads automatically
- [ ] Verify back button works
- [ ] Verify no search input present
- [ ] Verify all functionality works

## Benefits After Update

✅ No manual budget ID entry
✅ Automatic data loading
✅ Better navigation with back button
✅ Cleaner UI without search card
✅ Consistent UX across all modules
