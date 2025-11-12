//path: backend/src/routes/fileShare.routes.ts

import { Router } from 'express';
import {
  shareFile,
  getSharedFiles,
  getFileShares,
  markFileViewed,
  markFileDownloaded,
  deleteFileShare,
  getProjectSharedFiles
} from '../controllers/fileShareController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateObjectId, validateRequiredFields } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/files/:fileId/share',
  validateObjectId('fileId'),
  validateRequiredFields(['employeeIds']),
  shareFile
);

router.get('/shared', getSharedFiles);

router.get('/projects/:projectId/shares',
  validateObjectId('projectId'),
  getProjectSharedFiles
);

router.get('/files/:fileId/shares',
  validateObjectId('fileId'),
  getFileShares
);

router.patch('/shares/:shareId/viewed',
  validateObjectId('shareId'),
  markFileViewed
);

router.patch('/shares/:shareId/downloaded',
  validateObjectId('shareId'),
  markFileDownloaded
);

router.delete('/shares/:shareId',
  validateObjectId('shareId'),
  deleteFileShare
);

export default router;
