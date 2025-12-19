import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../public/uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.txt', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
