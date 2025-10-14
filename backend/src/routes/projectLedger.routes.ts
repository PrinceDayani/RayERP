//path: backend/src/routes/projectLedger.routes.ts

import { Router } from 'express';
import {
  getProjectJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  postJournalEntry,
  approveJournalEntry,
  deleteJournalEntry,
  getProjectLedgerEntries,
  getProjectTrialBalance
} from '../controllers/projectLedgerController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateObjectId, validateRequiredFields } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// Journal Entry routes
router.get('/:projectId/journal-entries', validateObjectId('projectId'), getProjectJournalEntries);
router.get('/:projectId/journal-entries/:entryId', 
  validateObjectId('projectId'), 
  validateObjectId('entryId'), 
  getJournalEntryById
);
router.post('/:projectId/journal-entries', 
  validateObjectId('projectId'),
  validateRequiredFields(['date', 'reference', 'description', 'lines']),
  createJournalEntry
);
router.put('/:projectId/journal-entries/:entryId', 
  validateObjectId('projectId'),
  validateObjectId('entryId'),
  validateRequiredFields(['date', 'reference', 'description', 'lines']),
  updateJournalEntry
);
router.patch('/:projectId/journal-entries/:entryId/post', 
  validateObjectId('projectId'),
  validateObjectId('entryId'),
  postJournalEntry
);
router.patch('/:projectId/journal-entries/:entryId/approve', 
  validateObjectId('projectId'),
  validateObjectId('entryId'),
  approveJournalEntry
);
router.delete('/:projectId/journal-entries/:entryId', 
  validateObjectId('projectId'),
  validateObjectId('entryId'),
  deleteJournalEntry
);

// Ledger Entry routes
router.get('/:projectId/ledger-entries', validateObjectId('projectId'), getProjectLedgerEntries);

// Trial Balance route
router.get('/:projectId/trial-balance', validateObjectId('projectId'), getProjectTrialBalance);

export default router;