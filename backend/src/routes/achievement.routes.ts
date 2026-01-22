import { Router } from 'express';
import { protect as authenticate } from '../middleware/auth.middleware';
import {
    getEmployeeAchievements,
    getAchievement,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    verifyAchievement,
    unverifyAchievement,
    getExpiringCertifications,
    getAchievementsByCategory,
    getAchievementStats
} from '../controllers/achievementController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee achievements routes
router.get('/employee/:employeeId', getEmployeeAchievements);
router.get('/employee/:employeeId/stats', getAchievementStats);
router.get('/employee/:employeeId/expiring', getExpiringCertifications);
router.get('/employee/:employeeId/by-category', getAchievementsByCategory);
router.post('/employee/:employeeId', createAchievement);

// Single achievement routes
router.get('/:id', getAchievement);
router.put('/:id', updateAchievement);
router.delete('/:id', deleteAchievement);
router.post('/:id/verify', verifyAchievement);
router.post('/:id/unverify', unverifyAchievement);

export default router;
