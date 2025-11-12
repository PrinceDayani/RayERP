import express from 'express';
import multer from 'multer';
import path from 'path';
import chatController from '../controllers/chatController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.use(protect);

router.get('/chats', chatController.getChats);
router.post('/chats', chatController.getOrCreateChat);
router.post('/chats/message', chatController.sendMessage);
router.post('/chats/upload', upload.single('file'), chatController.uploadFile);
router.get('/chats/:chatId/messages', chatController.getMessages);
router.put('/chats/:chatId/read', chatController.markAsRead);
router.get('/users', chatController.getUsers);

export default router;
