import express from 'express';
import * as journalEnhanced from '../controllers/journalEnhancedController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

// Recurring Entries
router.post('/recurring/generate', journalEnhanced.generateRecurringEntries);

// Reversing Entries
router.post('/:id/reverse', journalEnhanced.createReversingEntry);

// Templates
router.post('/from-template/:templateId', journalEnhanced.createFromTemplate);

// Batch Import
router.post('/batch-import', journalEnhanced.batchImport);

// Allocation Rules
router.post('/allocate/:ruleId', journalEnhanced.applyAllocationRule);

// Approval Workflow
router.post('/:id/approve', journalEnhanced.approveEntry);

// Bulk Operations
router.post('/bulk-post', journalEnhanced.bulkPost);

// Budget Impact
router.post('/budget-impact', journalEnhanced.getBudgetImpact);

// Smart Suggestions
router.get('/suggestions/accounts', journalEnhanced.getAccountSuggestions);

// Attachments
router.post('/:id/attachments', journalEnhanced.addAttachment);

// Copy Entry
router.post('/:id/copy', journalEnhanced.copyEntry);

export default router;
