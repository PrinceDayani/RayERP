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
import { financeWriteRateLimiter, financePostRateLimiter } from '../middleware/financeRateLimit.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { voucherValidation, validate } from '../middleware/validation.middleware';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', financeWriteRateLimiter, voucherValidation, validate, createVoucher);
router.get('/', cacheMiddleware(60), getVouchers);
router.get('/stats', cacheMiddleware(120), getVoucherStats);
router.get('/:id', getVoucherById);
router.put('/:id', financeWriteRateLimiter, voucherValidation, validate, updateVoucher);
router.post('/:id/post', financePostRateLimiter, postVoucher);
router.post('/:id/cancel', financeWriteRateLimiter, cancelVoucher);
router.delete('/:id', financeWriteRateLimiter, deleteVoucher);

export default router;
