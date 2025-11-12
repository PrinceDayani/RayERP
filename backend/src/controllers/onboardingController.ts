import { Request, Response } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import { UserProject } from '../models/UserProject';
import Project from '../models/Project';
import { seedDefaultRoles } from '../utils/seedDefaultRoles';

export const onboardUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, roleIds, projectIds } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    await seedDefaultRoles();
    
    let assignedRoleId = role;
    if (!assignedRoleId) {
      const defaultRole = await Role.findOne({ isDefault: true }).sort({ level: 1 });
      assignedRoleId = defaultRole?._id;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRoleId
    });

    if (projectIds?.length) {
      await Promise.all(
        projectIds.map((projectId: string) =>
          UserProject.create({
            userId: user._id,
            projectId,
            accessLevel: 'read',
            assignedBy: req.user?.id
          })
        )
      );
    }

    const result = await User.findById(user._id)
      .populate('role')
      .select('-password');

    res.status(201).json({ message: 'User onboarded successfully', user: result });
  } catch (error: any) {
    res.status(500).json({ message: 'Error onboarding user', error: error.message });
  }
};

export const getOnboardingData = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find({ isActive: true }).select('name description');
    const projects = await Project.find({ status: { $in: ['planning', 'active'] } })
      .select('name description');

    res.json({ roles, projects });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
};

export const getUserWithProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('role')
      .select('-password');
    
    const projects = await UserProject.find({ userId, isActive: true })
      .populate('projectId', 'name description');

    res.json({ user, projects });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
};