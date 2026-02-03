import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.middleware';
import { profileUpdateRateLimiter, uploadRateLimiter, deleteRateLimiter } from '../middleware/rateLimiter.middleware';
import { 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  deleteAvatar 
} from '../controllers/profileController';

const router = express.Router();

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/', getProfile);
router.put('/', profileUpdateRateLimiter, updateProfile);

// Avatar routes
router.post('/avatar', uploadRateLimiter, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteRateLimiter, deleteAvatar);

export default router;
