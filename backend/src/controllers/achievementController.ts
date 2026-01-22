import { Request, Response } from 'express';
import Achievement from '../models/Achievement';
import Employee from '../models/Employee';

// Get all achievements for an employee
export const getEmployeeAchievements = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const { category, verified } = req.query;

        const filter: any = { employee: employeeId };

        if (category) {
            filter.category = category;
        }

        if (verified !== undefined) {
            filter.verified = verified === 'true';
        }

        const achievements = await Achievement.find(filter)
            .sort({ date: -1 })
            .populate('createdBy', 'username email')
            .populate('verifiedBy', 'username email');

        res.json(achievements);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single achievement
export const getAchievement = async (req: Request, res: Response) => {
    try {
        const achievement = await Achievement.findById(req.params.id)
            .populate('employee', 'firstName lastName employeeId')
            .populate('createdBy', 'username email')
            .populate('verifiedBy', 'username email');

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        res.json(achievement);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create achievement
export const createAchievement = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        // Verify employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const achievement = new Achievement({
            ...req.body,
            employee: employeeId,
            createdBy: (req as any).user._id
        });

        await achievement.save();

        const populated = await achievement.populate('createdBy', 'username email');

        res.status(201).json(populated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Update achievement
export const updateAchievement = async (req: Request, res: Response) => {
    try {
        const { verified, verifiedBy, verifiedAt, createdBy, employee, ...updateData } = req.body;

        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('createdBy', 'username email')
            .populate('verifiedBy', 'username email');

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        res.json(achievement);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Delete achievement
export const deleteAchievement = async (req: Request, res: Response) => {
    try {
        const achievement = await Achievement.findByIdAndDelete(req.params.id);

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        res.json({ message: 'Achievement deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Verify achievement
export const verifyAchievement = async (req: Request, res: Response) => {
    try {
        const achievement = await Achievement.findById(req.params.id);

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        await achievement.verify((req as any).user._id);

        const updated = await Achievement.findById(req.params.id)
            .populate('createdBy', 'username email')
            .populate('verifiedBy', 'username email');

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Unverify achievement
export const unverifyAchievement = async (req: Request, res: Response) => {
    try {
        const achievement = await Achievement.findById(req.params.id);

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        await achievement.unverify();

        const updated = await Achievement.findById(req.params.id)
            .populate('createdBy', 'username email');

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get expiring certifications
export const getExpiringCertifications = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        const expiring = await (Achievement as any).getExpiring(employeeId);
        res.json(expiring);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get achievements by category
export const getAchievementsByCategory = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        const achievements = await Achievement.find({ employee: employeeId });

        const grouped = achievements.reduce((acc: any, achievement) => {
            if (!acc[achievement.category]) {
                acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get achievement statistics
export const getAchievementStats = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        const achievements = await Achievement.find({ employee: employeeId });

        const stats = {
            total: achievements.length,
            byCategory: {} as any,
            verified: achievements.filter(a => a.verified).length,
            expiringSoon: achievements.filter(a => (a as any).isExpiringSoon).length,
            expired: achievements.filter(a => (a as any).isExpired).length
        };

        achievements.forEach(achievement => {
            if (!stats.byCategory[achievement.category]) {
                stats.byCategory[achievement.category] = 0;
            }
            stats.byCategory[achievement.category]++;
        });

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
