import express from 'express';
import * as resourceController from '../controllers/resourceController';

const router = express.Router();

router.post('/allocations', resourceController.allocateResource);
router.get('/allocations', resourceController.getResourceAllocations);
router.put('/allocations/:id', resourceController.updateResourceAllocation);
router.delete('/allocations/:id', resourceController.deleteResourceAllocation);
router.get('/utilization', resourceController.getResourceUtilization);
router.get('/conflicts', resourceController.detectResourceConflicts);
router.get('/capacity-planning', resourceController.getCapacityPlanning);
router.get('/skill-matrix', resourceController.getSkillMatrix);
router.get('/time-tracking', resourceController.getTimeTracking);

export default router;
