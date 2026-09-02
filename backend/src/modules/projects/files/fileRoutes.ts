import { Router } from 'express';
import {
  getProjectFiles,
  uploadProjectFile,
  downloadProjectFile,
  deleteProjectFile,
  shareProjectFile,
  updateProjectFileMetadata,
  upload
} from './fileController';
import { validateObjectId } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';

const router = Router({ mergeParams: true });

router.get('/', validateObjectId('id'), checkProjectAccess, getProjectFiles);
router.post('/', validateObjectId('id'), checkProjectAccess, upload.single('file'), uploadProjectFile);
router.put('/:fileId/share',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  shareProjectFile
);
// Edit the document-register entry (category, drawing number, revision, approval)
router.put('/:fileId',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  updateProjectFileMetadata
);
router.get('/:fileId/download',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  downloadProjectFile
);
router.delete('/:fileId',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  deleteProjectFile
);

export default router;
