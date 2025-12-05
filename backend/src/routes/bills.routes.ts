import express from 'express';
import { createBill, getBills, getBillById, updateBill, deleteBill, makePayment, getBillPayments, getBillsSummary } from '../controllers/billsController';
import { protect } from '../middleware/auth.middleware';
import { requireFinanceAccess } from '../middleware/financePermission.middleware';

const router = express.Router();

router.use(protect);

router.post('/', requireFinanceAccess('bills.create'), createBill);
router.get('/', requireFinanceAccess('bills.view'), getBills);
router.get('/summary', requireFinanceAccess('bills.view'), getBillsSummary);
router.get('/:id', requireFinanceAccess('bills.view'), getBillById);
router.put('/:id', requireFinanceAccess('bills.edit'), updateBill);
router.delete('/:id', requireFinanceAccess('bills.delete'), deleteBill);
router.post('/:id/payments', requireFinanceAccess('bills.edit'), makePayment);
router.get('/:id/payments', requireFinanceAccess('bills.view'), getBillPayments);

export default router;
