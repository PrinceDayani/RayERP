import express from 'express';
import { 
  createVoucher, 
  getVouchers, 
  getVoucherById,
  updateVoucher,
  postVoucher, 
  cancelVoucher,
  deleteVoucher,
  getVoucherStats
} from '../controllers/voucherController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', createVoucher);
router.get('/', getVouchers);
router.get('/stats', getVoucherStats);
router.get('/:id', getVoucherById);
router.put('/:id', updateVoucher);
router.post('/:id/post', postVoucher);
router.post('/:id/cancel', cancelVoucher);
router.delete('/:id', deleteVoucher);

export default router;
