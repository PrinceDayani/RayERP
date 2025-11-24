import express from 'express';
import * as resourceController from '../controllers/resourceController';

const router = express.Router();

// Resource Allocation routes
router.post('/allocations', resourceController.allocateResource);
router.get('/allocations', resourceController.getResourceAllocations);
router.put('/allocations/:id', resourceController.updateResourceAllocation);
router.delete('/allocations/:id', resourceController.deleteResourceAllocation);
router.get('/utilization', resourceController.getResourceUtilization);
router.get('/conflicts', resourceController.detectResourceConflicts);
router.get('/capacity-planning', resourceController.getCapacityPlanning);
router.get('/time-tracking', resourceController.getTimeTracking);

// Enhanced Skill Matrix routes
router.get('/skill-matrix', resourceController.getSkillMatrix);
router.put('/skill-matrix/:employeeId/skills', resourceController.updateEmployeeSkill);
router.get('/skill-gap-analysis', resourceController.getSkillGapAnalysis);
router.get('/project-skill-match/:projectId', resourceController.getProjectSkillMatch);
router.get('/skill-distribution', resourceController.getSkillDistribution);
router.get('/skill-strength', resourceController.getSkillStrengthAnalysis);

// Enhanced allocation management routes
router.get('/allocation-conflicts', resourceController.getAllocationConflicts);
router.get('/employee-summary', resourceController.getEmployeeSummary);
router.post('/export-allocations', resourceController.exportAllocations);
router.put('/bulk-update', resourceController.bulkUpdateAllocations);
router.get('/gantt-data', resourceController.getGanttData);
router.post('/validate-allocation', resourceController.validateAllocation);

export default router;
