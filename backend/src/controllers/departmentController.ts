import { Request, Response } from 'express';
import Department from '../models/Department';
import Employee from '../models/Employee';

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
      const count = await Employee.countDocuments({ department: dept.name });
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
    res.json({ success: true, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, manager, location, budget, status, managerId, employeeIds } = req.body;

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
      await Employee.updateMany(
        { _id: { $in: employeesToAssign } },
        { department: department.name }
      );
    }

    // Update employee count (includes manager)
    const count = await Employee.countDocuments({ department: department.name });
    department.employeeCount = count;
    await department.save();

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

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const oldName = department.name;

    if (name && name !== oldName) {
      const existingDept = await Department.findOne({ name });
      if (existingDept) {
        return res.status(400).json({ success: false, message: 'Department name already exists' });
      }
      // Update all employees with old department name
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
      await Employee.updateMany(
        { _id: { $in: employeesToAssign } },
        { department: updated!.name }
      );
    }

    // Update employee count (includes manager)
    const count = await Employee.countDocuments({ department: updated!.name });
    updated!.employeeCount = count;
    await updated!.save();

    res.json({ success: true, data: updated, message: 'Department updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (department.employeeCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete department with employees. Please reassign employees first.' 
      });
    }

    await Department.findByIdAndDelete(req.params.id);
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
    const employees = await Employee.countDocuments({ department: id });
    
    const department = await Department.findByIdAndUpdate(
      id,
      { employeeCount: employees },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

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
    const employees = await Employee.find({ department: department.name }).select('firstName lastName email position status');
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignEmployees = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body;

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

    await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { department: department.name }
    );

    const count = await Employee.countDocuments({ department: department.name });
    department.employeeCount = count;
    await department.save();

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

    // Only unassign if employee is in this department
    if (employee.department !== department.name) {
      return res.status(400).json({ success: false, message: 'Employee is not in this department' });
    }

    await Employee.findByIdAndUpdate(employeeId, { department: '' });

    const count = await Employee.countDocuments({ department: department.name });
    department.employeeCount = count;
    await department.save();

    res.json({ success: true, message: 'Employee unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
