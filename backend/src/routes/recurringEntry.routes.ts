import express from 'express';
import { createRecurringEntry, getRecurringEntries, updateRecurringEntry, deleteRecurringEntry, processRecurringEntries } from '../controllers/recurringEntryController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', createRecurringEntry);
router.get('/', getRecurringEntries);
router.put('/:id', updateRecurringEntry);
router.delete('/:id', deleteRecurringEntry);
router.post('/process', processRecurringEntries);

export default router;
