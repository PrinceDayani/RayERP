import { Request, Response } from 'express';
import Department from '../models/Department';
import Employee from '../models/Employee';
import DepartmentBudget from '../models/DepartmentBudget';
import { logActivity } from '../utils/activityLogger';
import Project from '../models/Project';
import ActivityLog from '../models/ActivityLog';
import { registerCacheInvalidator } from '../utils/dashboardCache';

// Department cache with 5min TTL
let departmentsCache: { data: any; timestamp: number } | null = null;
let departmentDetailsCache: Map<string, { data: any; timestamp: number }> = new Map();
let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 300000; // 5 minutes

const clearDepartmentCache = () => {
  departmentsCache = null;
  departmentDetailsCache.clear();
  statsCache = null;
};

registerCacheInvalidator(clearDepartmentCache);

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const cacheKey = JSON.stringify({ search, status });
    
    if (!search && !status && departmentsCache && Date.now() - departmentsCache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: departmentsCache.data, cached: true });
    }

    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'manager.name': { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(filter).sort({ createdAt: -1 });

    // Update employee counts for all departments
    for (const dept of departments) {
      const count = await Employee.countDocuments({ departments: dept.name });
      if (dept.employeeCount !== count) {
        dept.employeeCount = count;
        await dept.save();
      }
    }

    if (!search && !status) {
      departmentsCache = { data: departments, timestamp: Date.now() };
    }

    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const cacheKey = req.params.id;
    const cached = departmentDetailsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const budgets = await DepartmentBudget.find({ departmentId: req.params.id });
    const budgetSummary = {
      totalAllocated: budgets.reduce((sum, b) => sum + b.totalBudget, 0),
      totalSpent: budgets.reduce((sum, b) => sum + b.spentBudget, 0),
      budgetCount: budgets.length
    };

    const result = { ...department.toObject(), budgetSummary };
    departmentDetailsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, manager, location, budget, status, managerId, employeeIds } = req.body;
    const user = (req as any).user;

    console.log('Create department request:', { name, description, manager, location, budget, status, managerId, employeeIds });

    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Name and description are required' });
    }

    if (!location) {
      return res.status(400).json({ success: false, message: 'Location is required. Please fill the Details tab.' });
    }

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    // Validate manager if provided
    if (managerId) {
      const managerExists = await Employee.findById(managerId);
      if (!managerExists) {
        return res.status(404).json({ success: false, message: 'Manager not found' });
      }
    }

    const department = await Department.create({
      name,
      description,
      manager: manager || { name: '', email: '', phone: '' },
      location,
      budget: budget || 0,
      status: status || 'active',
      employeeCount: 0
    });

    const employeesToAssign = [];

    // Add manager to employees list if provided
    if (managerId) {
      employeesToAssign.push(managerId);
    }

    // Add other employees if provided
    if (employeeIds && employeeIds.length > 0) {
      employeesToAssign.push(...employeeIds);
    }

    // Assign all employees (including manager) to department
    if (employeesToAssign.length > 0) {
      for (const empId of employeesToAssign) {
        const emp = await Employee.findById(empId);
        const updateData: any = { $addToSet: { departments: department.name } };
        // Only set primary department if employee doesn't have one
        if (!emp?.department) {
          updateData.$set = { department: department.name };
        }
        await Employee.findByIdAndUpdate(empId, updateData);
      }
    }

    // Update employee count (includes manager)
    const count = await Employee.countDocuments({ departments: department.name });
    department.employeeCount = count;
    await department.save();

    // Log activity
    await logActivity({
      userId: user._id,
      userName: user.name || user.email,
      action: 'create',
      resource: `Department: ${name}`,
      resourceType: 'department',
      resourceId: department._id,
      details: `Created department "${name}" with ${count} employees and budget ${budget}`,
      metadata: { departmentId: department._id, employeeCount: count, budget },
      ipAddress: req.ip
    });

    console.log('Department created successfully:', department);
    clearDepartmentCache();
    res.status(201).json({ success: true, data: department, message: 'Department created successfully' });
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, manager, location, budget, status, managerId, employeeIds } = req.body;
    const user = (req as any).user;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const oldName = department.name;
    const newName = name || oldName;

    if (name && name !== oldName) {
      const existingDept = await Department.findOne({ name });
      if (existingDept) {
        return res.status(400).json({ success: false, message: 'Department name already exists' });
      }
      // Update all employees with old department name
      await Employee.updateMany(
        { departments: oldName },
        { $set: { departments: { $map: { input: '$departments', as: 'd', in: { $cond: [{ $eq: ['$$d', oldName] }, name, '$$d'] } } } } }
      );
      await Employee.updateMany(
        { department: oldName },
        { department: name }
      );
    }

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, manager, location, budget, status },
      { new: true, runValidators: true }
    );

    // Get current employees in this department
    const currentEmployees = await Employee.find({ departments: newName });
    const currentEmployeeIds = currentEmployees.map(e => e._id.toString());

    const employeesToAssign = [];

    // Add manager to employees list if provided
    if (managerId) {
      employeesToAssign.push(managerId);
    }

    // Add other employees if provided
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      employeesToAssign.push(...employeeIds);
    }

    // Find employees to remove (in current but not in new list)
    const employeesToRemove = currentEmployeeIds.filter(id => !employeesToAssign.includes(id));

    // Remove department from employees no longer in this department
    for (const empId of employeesToRemove) {
      await Employee.findByIdAndUpdate(empId, {
        $pull: { departments: updated!.name }
      });
      // Update primary department if needed
      const emp = await Employee.findById(empId);
      if (emp && emp.department === updated!.name) {
        const newPrimaryDept = emp.departments && emp.departments.length > 0 ? emp.departments[0] : '';
        await Employee.findByIdAndUpdate(empId, { department: newPrimaryDept });
      }
    }

    // Add department to new employees
    for (const empId of employeesToAssign) {
      const emp = await Employee.findById(empId);
      const updateData: any = { $addToSet: { departments: updated!.name } };
      // Only set primary department if employee doesn't have one
      if (!emp?.department) {
        updateData.$set = { department: updated!.name };
      }
      await Employee.findByIdAndUpdate(empId, updateData);
    }

    // Update employee count (includes manager)
    const count = await Employee.countDocuments({ departments: updated!.name });
    updated!.employeeCount = count;
    await updated!.save();

    // Log activity
    await logActivity({
      userId: user._id,
      userName: user.name || user.email,
      action: 'update',
      resource: `Department: ${updated!.name}`,
      resourceType: 'department',
      resourceId: updated!._id,
      details: `Updated department "${updated!.name}" - Employee count: ${count}, Budget: ${budget}`,
      metadata: {
        departmentId: updated!._id,
        changes: { name: oldName !== newName, employeeCount: count, budget },
        oldName: oldName !== newName ? oldName : undefined
      },
      ipAddress: req.ip
    });

    clearDepartmentCache();
    res.json({ success: true, data: updated, message: 'Department updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { confirmText } = req.body;
    const user = (req as any).user;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Validate confirmation text
    if (confirmText !== department.name) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation text does not match department name'
      });
    }

    if (department.employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with employees. Please reassign employees first.'
      });
    }

    // Remove department from all employees
    await Employee.updateMany(
      { departments: department.name },
      { $pull: { departments: department.name } }
    );
    await Employee.updateMany(
      { department: department.name },
      { department: '' }
    );

    await Department.findByIdAndDelete(req.params.id);

    // Log activity
    await logActivity({
      userId: user._id,
      userName: user.name || user.email,
      action: 'delete',
      resource: `Department: ${department.name}`,
      resourceType: 'department',
      resourceId: department._id,
      details: `Deleted department "${department.name}" with budget ${department.budget}`,
      metadata: {
        departmentName: department.name,
        budget: department.budget,
        location: department.location,
        employeeCount: department.employeeCount
      },
      ipAddress: req.ip,
      severity: 'medium'
    });

    clearDepartmentCache();
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentStats = async (req: Request, res: Response) => {
  try {
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: statsCache.data, cached: true });
    }

    const total = await Department.countDocuments();
    const active = await Department.countDocuments({ status: 'active' });
    const inactive = await Department.countDocuments({ status: 'inactive' });

    const departments = await Department.find();
    const totalEmployees = departments.reduce((sum, dept) => sum + dept.employeeCount, 0);
    const totalBudget = departments.reduce((sum, dept) => sum + dept.budget, 0);

    const statsData = {
      total,
      active,
      inactive,
      totalEmployees,
      totalBudget,
      avgTeamSize: total > 0 ? (totalEmployees / total).toFixed(1) : 0
    };

    statsCache = { data: statsData, timestamp: Date.now() };

    res.json({ success: true, data: statsData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployeeCount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const employees = await Employee.countDocuments({ departments: department.name });

    department.employeeCount = employees;
    await department.save();

    res.json({ success: true, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentEmployees = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    const employees = await Employee.find({ departments: department.name }).select('firstName lastName email position status departments');
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignEmployees = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body;
    const user = (req as any).user;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Employee IDs are required' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Verify all employees exist
    const employees = await Employee.find({ _id: { $in: employeeIds } });
    if (employees.length !== employeeIds.length) {
      return res.status(404).json({ success: false, message: 'One or more employees not found' });
    }

    for (const empId of employeeIds) {
      const emp = await Employee.findById(empId);
      const updateData: any = { $addToSet: { departments: department.name } };
      // Only set primary department if employee doesn't have one
      if (!emp?.department) {
        updateData.$set = { department: department.name };
      }
      await Employee.findByIdAndUpdate(empId, updateData);
    }

    const count = await Employee.countDocuments({ departments: department.name });
    department.employeeCount = count;
    await department.save();

    // Log activity
    await logActivity({
      userId: user._id,
      userName: user.name || user.email,
      action: 'assign',
      resource: `Department: ${department.name}`,
      resourceType: 'department',
      resourceId: department._id,
      details: `Assigned ${employeeIds.length} employee(s) to department "${department.name}"`,
      metadata: {
        departmentId: department._id,
        employeeIds,
        employeeNames: employees.map(e => `${e.firstName} ${e.lastName}`)
      },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `${employeeIds.length} employee(s) assigned successfully`, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unassignEmployee = async (req: Request, res: Response) => {
  try {
    const { id, employeeId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Remove department from employee's departments array
    await Employee.findByIdAndUpdate(employeeId, {
      $pull: { departments: department.name }
    });

    // Update primary department if it was this one
    const updatedEmployee = await Employee.findById(employeeId);
    if (updatedEmployee && updatedEmployee.department === department.name) {
      const newPrimaryDept = updatedEmployee.departments && updatedEmployee.departments.length > 0
        ? updatedEmployee.departments[0]
        : '';
      await Employee.findByIdAndUpdate(employeeId, { department: newPrimaryDept });
    }

    const count = await Employee.countDocuments({ departments: department.name });
    department.employeeCount = count;
    await department.save();

    res.json({ success: true, message: 'Employee unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartmentPermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions array is required' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    department.permissions = permissions;
    await department.save();

    res.json({ success: true, data: department, message: 'Department permissions updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentPermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, data: { permissions: department.permissions || [] } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addDepartmentPermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({ success: false, message: 'Permission is required' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (!department.permissions) {
      department.permissions = [];
    }

    if (department.permissions.includes(permission)) {
      return res.status(400).json({ success: false, message: 'Permission already exists' });
    }

    department.permissions.push(permission);
    await department.save();

    res.json({ success: true, data: department, message: 'Permission added successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeDepartmentPermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({ success: false, message: 'Permission is required' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (!department.permissions || !department.permissions.includes(permission)) {
      return res.status(400).json({ success: false, message: 'Permission not found' });
    }

    department.permissions = department.permissions.filter(p => p !== permission);
    await department.save();

    res.json({ success: true, data: department, message: 'Permission removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllEmployeesForDepartment = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find().select('firstName lastName email position status department departments phone');
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Get department employees
    const employees = await Employee.find({ departments: department.name });

    // Get department projects
    const projects = await Project.find({ departments: department._id });

    // Get activity logs for this department
    const activityLogs = await ActivityLog.find({
      resourceType: 'department',
      resourceId: department._id
    }).sort({ timestamp: -1 }).limit(50);

    // Calculate analytics
    const analytics = {
      overview: {
        totalEmployees: employees.length,
        totalProjects: projects.length,
        budget: department.budget,
        budgetUtilization: 0, // Calculate based on expenses
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length
      },
      employeeStats: {
        byPosition: employees.reduce((acc: any, emp) => {
          acc[emp.position] = (acc[emp.position] || 0) + 1;
          return acc;
        }, {}),
        byStatus: employees.reduce((acc: any, emp) => {
          acc[emp.status] = (acc[emp.status] || 0) + 1;
          return acc;
        }, {})
      },
      projectStats: {
        byStatus: projects.reduce((acc: any, proj) => {
          acc[proj.status] = (acc[proj.status] || 0) + 1;
          return acc;
        }, {}),
        totalBudget: projects.reduce((sum, proj) => sum + (proj.budget || 0), 0)
      },
      activityTrends: {
        totalActivities: activityLogs.length,
        recentActivities: activityLogs.slice(0, 10),
        activityByType: activityLogs.reduce((acc: any, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {})
      },
      performance: {
        employeeGrowth: 0, // Calculate month-over-month growth
        projectCompletionRate: projects.length > 0 ?
          (projects.filter(p => p.status === 'completed').length / projects.length * 100).toFixed(1) : 0,
        budgetEfficiency: department.budget > 0 ?
          ((department.budget - (projects.reduce((sum, p) => sum + (p.budget || 0), 0))) / department.budget * 100).toFixed(1) : 0
      }
    };

    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentProjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const projects = await Project.find({ departments: department._id })
      .populate('manager', 'firstName lastName email')
      .populate('team', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentNotifications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Get notifications related to this department
    const notifications = await ActivityLog.find({
      $or: [
        { resourceType: 'department', resourceId: department._id },
        { resource: { $regex: department.name, $options: 'i' } }
      ]
    }).sort({ timestamp: -1 }).limit(100);

    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentActivityLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, action, dateFrom, dateTo } = req.query;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const filter: any = {
      $or: [
        { resourceType: 'department', resourceId: department._id },
        { resource: { $regex: department.name, $options: 'i' } }
      ]
    };

    if (action) filter.action = action;
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom as string);
      if (dateTo) filter.timestamp.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Budget History Endpoint
export const getDepartmentBudgetHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Get budget records for this department
    const budgetRecords = await DepartmentBudget.find({ departmentId: id })
      .sort({ fiscalYear: -1, month: -1 })
      .limit(12);

    // Transform to monthly history format
    const history = budgetRecords.map(record => ({
      month: `${record.month}/${record.fiscalYear}`,
      allocated: record.totalBudget,
      spent: record.spentBudget,
      remaining: record.totalBudget - record.spentBudget,
      utilization: record.totalBudget > 0 ? Math.round((record.spentBudget / record.totalBudget) * 100) : 0
    }));

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Expenses Breakdown Endpoint
export const getDepartmentExpenses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Get latest budget record
    const latestBudget = await DepartmentBudget.findOne({ departmentId: id })
      .sort({ fiscalYear: -1, month: -1 });

    if (!latestBudget || !latestBudget.categories) {
      return res.json({ success: true, data: [] });
    }

    // Transform categories to expense breakdown
    const expenses = latestBudget.categories.map((cat: any) => {
      const trend = cat.spent > cat.allocated * 0.9 ? 'up' : cat.spent < cat.allocated * 0.5 ? 'down' : 'stable';
      return {
        category: cat.name,
        amount: cat.spent,
        percentage: latestBudget.totalBudget > 0 ? Math.round((cat.spent / latestBudget.totalBudget) * 100) : 0,
        trend
      };
    });

    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Performance Metrics Endpoint
export const getDepartmentPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const employees = await Employee.find({ departments: department.name });
    const projects = await Project.find({ departments: department._id });

    // Calculate metrics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;

    const metrics = {
      productivity: Math.min(100, Math.round(60 + (completedProjects / Math.max(totalProjects, 1)) * 40)),
      satisfaction: Math.min(100, Math.round(70 + (activeEmployees / Math.max(employees.length, 1)) * 30)),
      retention: Math.min(100, Math.round(75 + (activeEmployees / Math.max(employees.length, 1)) * 25)),
      growth: Math.round(((employees.length - 10) / Math.max(10, 1)) * 100), // Compare to baseline of 10
      efficiency: Math.min(100, Math.round(65 + (completedProjects / Math.max(totalProjects, 1)) * 35)),
      qualityScore: Math.min(100, Math.round(70 + (completedProjects / Math.max(totalProjects, 1)) * 30))
    };

    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Goals Endpoint
export const getDepartmentGoals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Sample goals based on department data
    const employees = await Employee.find({ departments: department.name });
    const projects = await Project.find({ departments: department._id });

    const goals = [
      {
        id: '1',
        title: 'Team Expansion',
        description: `Grow team to ${employees.length + 5} members`,
        target: employees.length + 5,
        current: employees.length,
        unit: 'people',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        priority: 'high',
        status: 'active'
      },
      {
        id: '2',
        title: 'Project Completion',
        description: 'Complete all ongoing projects',
        target: projects.length,
        current: projects.filter(p => p.status === 'completed').length,
        unit: 'projects',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
        priority: 'high',
        status: 'active'
      }
    ];

    res.json({ success: true, data: goals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resource Utilization Endpoint
export const getDepartmentResourceUtilization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const employees = await Employee.find({ departments: department.name });
    const projects = await Project.find({ departments: department._id });

    // Calculate utilization metrics
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalProjects = projects.length;

    const utilization = {
      capacity: Math.min(100, Math.round(65 + (employees.length / 50) * 35)), // Assumes 50 as full capacity 
      workload: Math.min(100, Math.round(50 + (activeProjects / Math.max(employees.length, 1)) * 50)),
      availability: Math.min(100, Math.round(80 + (employees.filter(e => e.status === 'active').length / Math.max(employees.length, 1)) * 20)),
      efficiency: Math.min(100, Math.round(60 + (projects.filter(p => p.status === 'completed').length / Math.max(totalProjects, 1)) * 40)),
      allocation: {
        Development: 60,
        Testing: 25,
        Management: 15
      }
    };

    res.json({ success: true, data: utilization });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Compliance Status Endpoint  
export const getDepartmentComplianceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const employees = await Employee.find({ departments: department.name });

    // Calculate compliance metrics
    const compliance = {
      training: Math.min(100, Math.round(80 + Math.random() * 20)), // Random for demo
      certifications: Math.min(100, Math.round(75 + Math.random() * 20)),
      policies: Math.min(100, Math.round(85 + Math.random() * 15)),
      security: Math.min(100, Math.round(80 + Math.random() * 20)),
      overall: 0,
      lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days ago
    };

    compliance.overall = Math.round((compliance.training + compliance.certifications + compliance.policies + compliance.security) / 4);

    res.json({ success: true, data: compliance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Budget Adjustment Endpoint
export const adjustDepartmentBudget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason, type } = req.body;
    const user = (req as any).user;

    if (!amount || !reason || !type) {
      return res.status(400).json({
        success: false,
        message: 'Amount, reason, and type are required'
      });
    }

    if (type !== 'increase' && type !== 'decrease') {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "increase" or "decrease"'
      });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const adjustment = type === 'increase' ? amount : -amount;
    department.budget += adjustment;
    await department.save();

    // Log the adjustment
    await logActivity({
      userId: user._id,
      userName: user.name || user.email,
      action: 'update',
      resource: `Department: ${department.name}`,
      resourceType: 'department',
      resourceId: department._id,
      details: `${type === 'increase' ? 'Increased' : 'Decreased'} budget by ${Math.abs(amount)}. Reason: ${reason}`,
      metadata: {
        departmentId: department._id,
        adjustmentType: type,
        amount,
        newBudget: department.budget,
        reason
      },
      ipAddress: req.ip,
      severity: 'medium'
    });

    res.json({
      success: true,
      data: department,
      message: `Budget ${type}d successfully`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

