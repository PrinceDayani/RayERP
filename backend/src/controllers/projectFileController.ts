//path: backend/src/controllers/projectFileController.ts

import { Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as zlib from 'zlib';
import { promisify } from 'util';
import sharp from 'sharp';
import ProjectFile from '../models/ProjectFile';
import Project from '../models/Project';
import { logActivity } from '../utils/activityLogger';
import { logger } from '../utils/logger';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Extend Request interface to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'projects');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all files for a project
export const getProjectFiles = async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const files = await ProjectFile.find({ project: projectId })
      .select('-fileData')
      .populate('uploadedBy', 'name email')
      .populate('sharedWithDepartments', 'name description')
      .populate('sharedWithUsers', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: files });
  } catch (error) {
    logger.error('Error fetching project files:', { message: error?.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Upload file to project
export const uploadProjectFile = async (req: MulterRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { sharedWithDepartments } = req.body;
    const userId = (req as any).user.id;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Read file data
    let fileData = fs.readFileSync(req.file.path);
    const originalSize = fileData.length;

    let finalData: Buffer = fileData;
    let isCompressed = false;

    // Lossless image optimization
    if (/^image\/(jpeg|jpg|png|webp|tiff)/.test(req.file.mimetype)) {
      try {
        const optimized = await sharp(fileData)
          .png({ compressionLevel: 9, quality: 100 })  // Lossless PNG
          .toBuffer();
        
        if (optimized.length < originalSize) {
          finalData = Buffer.from(optimized);
        }
      } catch (error) {
        // Optimization failed; fall back to original buffer
      }
    }
    // Gzip compression for documents
    else if (!/^(video|audio)\//.test(req.file.mimetype) && 
             !/\.(zip|rar|7z|gz|bz2)$/i.test(req.file.originalname)) {
      const compressedData = await gzip(fileData, { level: 9 });
      
      if (compressedData.length < originalSize * 0.95) {
        finalData = Buffer.from(compressedData);
        isCompressed = true;
      }
    }

    const { sharedWithUsers, shareType } = req.body;
    
    const projectFile = new ProjectFile({
      name: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: finalData.length,
      originalSize: originalSize,
      mimeType: req.file.mimetype,
      project: projectId,
      uploadedBy: userId,
      sharedWithDepartments: sharedWithDepartments ? JSON.parse(sharedWithDepartments) : [],
      sharedWithUsers: sharedWithUsers ? JSON.parse(sharedWithUsers) : [],
      shareType: shareType || 'department',
      fileData: finalData,
      storageType: 'database',
      compressed: isCompressed
    });

    await projectFile.save();

    // Delete file from disk after saving to DB
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    await projectFile.populate('uploadedBy', 'name email');

    // Log activity
    const user = (req as any).user;
    await logActivity({
      userId: userId,
      userName: user.name || user.email,
      action: 'share',
      resource: `File: ${req.file.originalname}`,
      resourceType: 'file',
      resourceId: projectFile._id,
      projectId: projectId,
      details: `Shared file "${req.file.originalname}" in project`,
      visibility: 'management',
      metadata: { fileName: req.file.originalname, fileSize: finalData.length }
    });

    // Remove fileData from response
    const response = projectFile.toObject();
    delete response.fileData;

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    logger.error('Error uploading file:', { message: error?.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Download project file
export const downloadProjectFile = async (req: Request, res: Response) => {
  try {
    const { id: projectId, fileId } = req.params;

    const file = await ProjectFile.findOne({ 
      _id: fileId, 
      project: projectId 
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // If stored in database
    if (file.storageType === 'database' && file.fileData) {
      let fileData = file.fileData;
      
      // Decompress if compressed
      if (file.compressed) {
        fileData = await gunzip(file.fileData);
      }
      
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.send(fileData);
    } 
    // If stored on disk (legacy)
    else if (fs.existsSync(file.path)) {
      res.download(file.path, file.originalName);
    } 
    else {
      return res.status(404).json({ message: 'File data not found' });
    }
  } catch (error) {
    logger.error('Error downloading file:', { message: error?.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Share file with departments/users
export const shareProjectFile = async (req: Request, res: Response) => {
  try {
    const { id: projectId, fileId } = req.params;
    const { departmentIds, userIds, shareType } = req.body;
    const userId = (req as any).user.id;
    const user = (req as any).user;

    const file = await ProjectFile.findOne({ _id: fileId, project: projectId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (shareType === 'department' || shareType === 'both') {
      file.sharedWithDepartments = departmentIds || [];
    }
    if (shareType === 'user' || shareType === 'both') {
      file.sharedWithUsers = userIds || [];
    }
    file.shareType = shareType;

    await file.save();
    await file.populate([
      { path: 'sharedWithDepartments', select: 'name' },
      { path: 'sharedWithUsers', select: 'name email' }
    ]);

    await logActivity({
      userId,
      userName: user.name || user.email,
      action: 'update',
      resource: `File: ${file.originalName}`,
      resourceType: 'file',
      resourceId: fileId,
      projectId,
      details: `Updated sharing settings for "${file.originalName}"`,
      visibility: 'management'
    });

    const response = file.toObject();
    delete response.fileData;
    res.json(response);
  } catch (error) {
    logger.error('Error sharing file:', { message: error?.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get files shared with user
export const getSharedFiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { departmentId } = req.query;

    const query: any = {
      $or: [
        { sharedWithUsers: userId },
        ...(departmentId ? [{ sharedWithDepartments: departmentId }] : [])
      ]
    };

    const files = await ProjectFile.find(query)
      .select('-fileData')
      .populate('project', 'name')
      .populate('uploadedBy', 'name email')
      .populate('sharedWithDepartments', 'name')
      .populate('sharedWithUsers', 'name email')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    logger.error('Error fetching shared files:', { message: error?.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete project file
export const deleteProjectFile = async (req: Request, res: Response) => {
  try {
    const { id: projectId, fileId } = req.params;
    const userId = (req as any).user.id;
    const user = (req as any).user;

    const file = await ProjectFile.findOne({ 
      _id: fileId, 
      project: projectId 
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const fileName = file.originalName;

    // Delete file from disk if it exists (legacy files)
    if (file.storageType === 'disk' && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await ProjectFile.findByIdAndDelete(fileId);

    // Log activity
    await logActivity({
      userId: userId,
      userName: user.name || user.email,
      action: 'delete',
      resource: `File: ${fileName}`,
      resourceType: 'file',
      resourceId: fileId,
      projectId: projectId,
      details: `Deleted file "${fileName}" from project`,
      visibility: 'management',
      metadata: { fileName }
    });

    res.json({ success: true, data: { message: 'File deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting file:', { message: error?.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}