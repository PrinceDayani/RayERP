// Add this to your server.ts file after MongoDB connection

import { initializeScheduler } from './utils/scheduler';
import balanceSheetRoutes from './routes/balanceSheetRoutes';

// Initialize scheduler for automated reports
initializeScheduler();

// Add balance sheet routes
app.use('/api/finance/balance-sheet', balanceSheetRoutes);

console.log('✅ Balance Sheet features initialized');
