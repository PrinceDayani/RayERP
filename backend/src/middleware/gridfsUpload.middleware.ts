import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import path from 'path';

const storage = new GridFsStorage({
  url: process.env.MONGO_URI!,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `file-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`,
      bucketName: 'documents'
    };
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const gridfsUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
