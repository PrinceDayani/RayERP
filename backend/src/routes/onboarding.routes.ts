import express from 'express';
import { onboardUser, getOnboardingData, getUserWithProjects } from '../controllers/onboardingController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);
router.post('/create', onboardUser);
router.get('/data', getOnboardingData);
router.get('/user/:userId', getUserWithProjects);

export default router;