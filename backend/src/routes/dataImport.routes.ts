// backend/src/routes/dataImport.routes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { importErpWorkbook } from '../controllers/dataImportController';

const router = express.Router();

// Workbooks are parsed in memory and never written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' && allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  },
});

// Import the Ray Infrastructures ERP workbook (tasks, roadmap, announcements)
router.post('/erp-workbook', protect, requirePermission('data.import'), upload.single('file'), importErpWorkbook);

export default router;
