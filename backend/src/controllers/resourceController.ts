import { Request, Response } from 'express';
import ResourceAllocation from '../models/ResourceAllocation';
import Employee from '../models/Employee';
import Task from '../models/Task';

export const allocateResource = async (req: Request, res: Response) => {
  try {
    const allocation = new ResourceAllocation(req.body);
    await allocation.save();
    await allocation.populate(['employee', 'project']);
    res.status(201).json(allocation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getResourceAllocations = async (req: Request, res: Response) => {
  try {
    const { projectId, employeeId, status } = req.query;
    const filter: any = {};
    if (projectId) filter.project = projectId;
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

    const allocations = await ResourceAllocation.find(filter)
      .populate('employee', 'firstName lastName email position skills')
      .populate('project', 'name status startDate endDate')
      .sort({ startDate: -1 });
    res.json(allocations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResourceAllocation = async (req: Request, res: Response) => {
  try {
    const allocation = await ResourceAllocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['employee', 'project']);
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    res.json(allocation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteResourceAllocation = async (req: Request, res: Response) => {
  try {
    const allocation = await ResourceAllocation.findByIdAndDelete(req.params.id);
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    res.json({ message: 'Allocation deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getResourceUtilization = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const filter: any = { employee: employeeId };
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ];
    }

    const allocations = await ResourceAllocation.find(filter).populate('project', 'name');
    const totalHours = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
    const avgUtilization = allocations.length > 0 
      ? allocations.reduce((sum, a) => sum + a.utilizationRate, 0) / allocations.length 
      : 0;

    res.json({ totalHours, avgUtilization, allocations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const detectResourceConflicts = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const conflicts = await ResourceAllocation.find({
      employee: employeeId,
      status: { $in: ['active', 'planned'] },
      $or: [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ]
    }).populate('project', 'name priority');

    const totalAllocated = conflicts.reduce((sum, c) => sum + c.allocatedHours, 0);
    const hasConflict = totalAllocated > 40;

    res.json({ hasConflict, totalAllocated, conflicts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCapacityPlanning = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const employees = await Employee.find({ status: 'active' });
    const planning = await Promise.all(employees.map(async (emp) => {
      const allocations = await ResourceAllocation.find({
        employee: emp._id,
        startDate: { $lte: new Date(endDate as string) },
        endDate: { $gte: new Date(startDate as string) }
      }).populate('project', 'name');

      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
      const capacity = 40;
      const available = capacity - totalAllocated;

      return {
        employee: { _id: emp._id, name: `${emp.firstName} ${emp.lastName}`, position: emp.position, skills: emp.skills },
        capacity,
        allocated: totalAllocated,
        available,
        utilizationRate: (totalAllocated / capacity) * 100,
        allocations
      };
    }));

    res.json(planning);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSkillMatrix = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({ status: 'active' }, 'firstName lastName position skills');
    const allSkills = [...new Set(employees.flatMap(e => e.skills || []))];
    
    const matrix = employees.map(emp => ({
      employee: { _id: emp._id, name: `${emp.firstName} ${emp.lastName}`, position: emp.position },
      skills: allSkills.map(skill => ({
        skill,
        has: emp.skills?.includes(skill) || false
      }))
    }));

    res.json({ matrix, allSkills });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTimeTracking = async (req: Request, res: Response) => {
  try {
    const { employeeId, projectId, startDate, endDate } = req.query;
    const filter: any = {};
    if (employeeId) filter.assignedTo = employeeId;
    if (projectId) filter.project = projectId;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('project', 'name')
      .select('title estimatedHours actualHours status');

    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const variance = totalActual - totalEstimated;

    res.json({ totalEstimated, totalActual, variance, tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
