import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { accountValidation, validate } from '../middleware/validation.middleware';
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  duplicateAccount,
  getAccountTypes,
  createAccountType,
  updateAccountType,
  deleteAccountType,
  bulkCreateAccounts
} from '../controllers/accountController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createAccount);
router.post('/bulk', bulkCreateAccounts);
router.post('/:id/duplicate', duplicateAccount);
router.get('/', getAccounts);
router.get('/types', getAccountTypes);
router.post('/types', createAccountType);
router.put('/types/:id', updateAccountType);
router.delete('/types/:id', deleteAccountType);
router.get('/project/:projectId', getAccounts);
router.get('/:id', getAccountById);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;