import express from 'express';
import { closePeriod, getClosedPeriods, lockPeriod, reopenPeriod } from '../controllers/periodClosingController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/close', closePeriod);
router.get('/', getClosedPeriods);
router.put('/:id/lock', lockPeriod);
router.put('/:id/reopen', reopenPeriod);

export default router;
