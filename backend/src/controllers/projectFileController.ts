//path: backend/src/controllers/projectFileController.ts

import { Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import ProjectFile from '../models/ProjectFile';
import Project from '../models/Project';

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
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const files = await ProjectFile.find({ project: projectId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload file to project
export const uploadProjectFile = async (req: MulterRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const projectFile = new ProjectFile({
      name: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      project: projectId,
      uploadedBy: userId
    });

    await projectFile.save();
    await projectFile.populate('uploadedBy', 'firstName lastName email');

    res.status(201).json(projectFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Download project file
export const downloadProjectFile = async (req: Request, res: Response) => {
  try {
    const { projectId, fileId } = req.params;

    const file = await ProjectFile.findOne({ 
      _id: fileId, 
      project: projectId 
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete project file
export const deleteProjectFile = async (req: Request, res: Response) => {
  try {
    const { projectId, fileId } = req.params;

    const file = await ProjectFile.findOne({ 
      _id: fileId, 
      project: projectId 
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await ProjectFile.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};