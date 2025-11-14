import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { 
  getSettings, 
  updateSettings, 
  switchAccountingMode,
  convertToIndianMode,
  convertToWesternMode
} from '../controllers/settingsController';

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.post('/switch-mode', protect, switchAccountingMode);
router.post('/convert-to-indian', protect, convertToIndianMode);
router.post('/convert-to-western', protect, convertToWesternMode);

export default router;
