//path: backend/src/controllers/fileShareController.ts

import { Request, Response } from 'express';
import FileShare from '../models/FileShare';
import ProjectFile from '../models/ProjectFile';
import Employee from '../models/Employee';
import Project from '../models/Project';

export const shareFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { employeeIds, message } = req.body;

    const file = await ProjectFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const project = await Project.findById(file.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const sharedBy = await Employee.findOne({ email: (req as any).user.email });
    if (!sharedBy) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employees = await Employee.find({ _id: { $in: employeeIds } });
    if (employees.length !== employeeIds.length) {
      return res.status(400).json({ message: 'Some employees not found' });
    }

    const fileShare = new FileShare({
      file: fileId,
      project: file.project,
      sharedBy: sharedBy._id,
      sharedWith: employeeIds,
      message
    });

    await fileShare.save();

    const populatedShare = await FileShare.findById(fileShare._id)
      .populate('file', 'name originalName size mimeType')
      .populate('sharedBy', 'firstName lastName email')
      .populate('sharedWith', 'firstName lastName email');

    res.status(201).json(populatedShare);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSharedFiles = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOne({ email: (req as any).user.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const sharedFiles = await FileShare.find({ sharedWith: employee._id })
      .populate('file', 'name originalName size mimeType')
      .populate('sharedBy', 'firstName lastName email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json(sharedFiles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectSharedFiles = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const shares = await FileShare.find({ project: projectId })
      .populate('file', 'name originalName size mimeType')
      .populate('sharedBy', 'firstName lastName email')
      .populate('sharedWith', 'firstName lastName email')
      .populate('viewedBy.employee', 'firstName lastName')
      .populate('downloadedBy.employee', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(shares);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFileShares = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    const shares = await FileShare.find({ file: fileId })
      .populate('sharedBy', 'firstName lastName email')
      .populate('sharedWith', 'firstName lastName email')
      .populate('viewedBy.employee', 'firstName lastName')
      .populate('downloadedBy.employee', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(shares);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markFileViewed = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;

    const employee = await Employee.findOne({ email: (req as any).user.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const share = await FileShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    if (!share.sharedWith.some(id => id.toString() === employee._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this file' });
    }

    const alreadyViewed = share.viewedBy.some(
      v => v.employee.toString() === employee._id.toString()
    );

    if (!alreadyViewed) {
      share.viewedBy.push({ employee: employee._id, viewedAt: new Date() });
      share.status = 'viewed';
      await share.save();
    }

    res.json(share);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markFileDownloaded = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;

    const employee = await Employee.findOne({ email: (req as any).user.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const share = await FileShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    if (!share.sharedWith.some(id => id.toString() === employee._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to download this file' });
    }

    const alreadyDownloaded = share.downloadedBy.some(
      d => d.employee.toString() === employee._id.toString()
    );

    if (!alreadyDownloaded) {
      share.downloadedBy.push({ employee: employee._id, downloadedAt: new Date() });
      share.status = 'downloaded';
      await share.save();
    }

    res.json(share);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFileShare = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;

    const employee = await Employee.findOne({ email: (req as any).user.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const share = await FileShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    if (share.sharedBy.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Only the sender can delete this share' });
    }

    await FileShare.findByIdAndDelete(shareId);
    res.json({ message: 'Share deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
