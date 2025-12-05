import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { 
  exportData, 
  getExportJobs, 
  downloadExport,
  cancelExportJob
} from '../controllers/dataExportController';

const router = express.Router();

router.post('/', protect, requirePermission('data.export'), exportData);
router.get('/jobs', protect, requirePermission('data.export'), getExportJobs);
router.get('/download/:jobId', protect, requirePermission('data.export'), downloadExport);
router.delete('/jobs/:jobId', protect, requirePermission('data.export'), cancelExportJob);

export default router;
