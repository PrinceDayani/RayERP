import { Router } from 'express';
import budgetRoutes from '../../../routes/budgetRoutes';

// Re-export existing budget routes
const router = Router({ mergeParams: true });
router.use('/', budgetRoutes);

export default router;
