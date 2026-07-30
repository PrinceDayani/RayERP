// Migration script: Convert singular manager to managers array
// Run this once to migrate existing data

import mongoose from 'mongoose';
import Project from '../models/Project';
import { logger } from './logger';

export const migrateProjectManagers = async () => {
  try {
    const projects = await Project.find({});

    for (const project of projects) {
      const doc = project as any;

      // If has old manager field but no managers array
      if (doc.manager && (!doc.managers || doc.managers.length === 0)) {
        doc.managers = [doc.manager];
        await doc.save();
      }
    }
  } catch (error: any) {
    logger.error('Migration failed', { message: error?.message });
    throw error;
  }
};
