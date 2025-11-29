import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  duplicateAccount,
  getAccountTypes,
  bulkCreateAccounts
} from '../controllers/accountController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createAccount);
router.post('/bulk', bulkCreateAccounts);
router.post('/:id/duplicate', duplicateAccount);
router.get('/', getAccounts);
router.get('/types', getAccountTypes);
router.get('/project/:projectId', getAccounts);
router.get('/:id', getAccountById);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;