import { Request, Response } from 'express';

// Re-export from existing projectPermissionController
export {
  getProjectPermissions,
  setProjectPermissions,
  removeProjectPermissions,
  getEmployeeProjectPermissions
} from '../../../controllers/projectPermissionController';
