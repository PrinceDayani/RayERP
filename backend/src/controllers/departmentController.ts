import { Request, Response } from 'express';
import Department from '../models/Department';
import Employee from '../models/Employee';
import DepartmentBudget from '../models/DepartmentBudget';
import { logActivity } from '../utils/activityLogger';
import Project from '../models/Project';
import ActivityLog from '../models/ActivityLog';

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
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
    
    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
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
    
    res.json({ success: true, data: { ...department.toObject(), budgetSummary } });
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

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentStats = async (req: Request, res: Response) => {
  try {
    const total = await Department.countDocuments();
    const active = await Department.countDocuments({ status: 'active' });
    const inactive = await Department.countDocuments({ status: 'inactive' });

    const departments = await Department.find();
    const totalEmployees = departments.reduce((sum, dept) => sum + dept.employeeCount, 0);
    const totalBudget = departments.reduce((sum, dept) => sum + dept.budget, 0);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        totalEmployees,
        totalBudget,
        avgTeamSize: total > 0 ? (totalEmployees / total).toFixed(1) : 0
      }
    });
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
