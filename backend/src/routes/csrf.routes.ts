import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { generateCsrfToken } from '../middleware/csrf.middleware';

const router = express.Router();

router.get('/token', protect, generateCsrfToken);

export default router;
