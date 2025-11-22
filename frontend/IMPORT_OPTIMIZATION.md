# Import Optimization Quick Reference

## ✅ Optimized Imports (Use These)

### Lucide React Icons
```typescript
// ✅ FAST - Tree-shakeable
import { Building2, ChevronLeft, ChevronRight, User, Settings } from 'lucide-react';
```

### Radix UI Components
```typescript
// ✅ FAST - Direct imports
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
```

### Date Functions
```typescript
// ✅ FAST - Specific functions
import { format, parseISO, addDays } from 'date-fns';
```

### Chart.js
```typescript
// ✅ FAST - Register only what you need
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement);
```

### Recharts
```typescript
// ✅ FAST - Component-level imports
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
```

## ❌ Slow Imports (Avoid These)

### Barrel Imports
```typescript
// ❌ SLOW - Imports everything
import * as Icons from 'lucide-react';
import * as RadixUI from '@radix-ui/react-dialog';
import * as dateFns from 'date-fns';
```

### Default Imports of Large Libraries
```typescript
// ❌ SLOW - Entire library
import _ from 'lodash';

// ✅ FAST - Specific function
import debounce from 'lodash/debounce';
```

## 🚀 Dynamic Imports for Heavy Components

### Charts & Visualizations
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
});
```

### PDF Generation
```typescript
const PDFGenerator = dynamic(() => import('@/components/PDFGenerator'), {
  ssr: false
});
```

### Excel Export
```typescript
const ExcelExport = dynamic(() => import('@/components/ExcelExport'), {
  ssr: false
});
```

## 📦 Package-Specific Tips

### React Hook Form
```typescript
// ✅ FAST
import { useForm, Controller } from 'react-hook-form';
```

### Framer Motion
```typescript
// ✅ FAST - Only what you need
import { motion, AnimatePresence } from 'framer-motion';
```

### Axios
```typescript
// ✅ FAST - Default import is fine
import axios from 'axios';
```

### Socket.IO Client
```typescript
// ✅ FAST
import { io } from 'socket.io-client';
```

## 🎯 Component Optimization

### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react';

// ✅ Expensive component
export const ExpensiveList = memo(({ items }) => {
  const sortedItems = useMemo(() => 
    items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  
  return <div>{/* render */}</div>;
});
```

### Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const AdminPanel = lazy(() => import('@/components/admin/AdminPanel'));

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminPanel />
    </Suspense>
  );
}
```

## 📊 Impact on Build Time

| Import Type | Build Impact | Bundle Size |
|-------------|--------------|-------------|
| Named imports | ✅ Fast | ✅ Small |
| Barrel imports | ❌ Slow | ❌ Large |
| Dynamic imports | ✅ Fast | ✅ Split |
| Default imports | ⚠️ Varies | ⚠️ Varies |

## 🔍 How to Check

### Find problematic imports
```bash
# Search for barrel imports
findstr /s /i "import \*" src\*.tsx src\*.ts
```

### Analyze bundle
```bash
npm run build:analyze
```

---

**Remember**: Every import adds to compilation time. Import only what you need!
