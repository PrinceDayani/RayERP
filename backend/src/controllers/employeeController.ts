import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Task from '../models/Task';
import User from '../models/User';
import { Role } from '../models/Role';
// Socket will be imported dynamically to avoid circular dependency

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find().populate('manager', 'firstName lastName');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('manager', 'firstName lastName');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const employeeData = req.body;
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    const nextId = lastEmployee ? 
      `EMP${(parseInt(lastEmployee.employeeId.slice(3)) + 1).toString().padStart(4, '0')}` : 
      'EMP0001';
    
    employeeData.employeeId = nextId;
    
    // Initialize departments array with primary department if provided
    if (employeeData.department && !employeeData.departments) {
      employeeData.departments = [employeeData.department];
    } else if (employeeData.department && employeeData.departments && !employeeData.departments.includes(employeeData.department)) {
      employeeData.departments.push(employeeData.department);
    }
    
    // Find Normal role
    const normalRole = await Role.findOne({ name: 'Normal' });
    if (!normalRole) {
      return res.status(400).json({ message: 'Normal role not found. Please ensure roles are seeded.' });
    }
    
    // Create user account for employee
    const user = await User.create({
      name: `${employeeData.firstName} ${employeeData.lastName}`,
      email: employeeData.email,
      password: employeeData.employeeId, // Default password is employee ID
      role: normalRole._id,
      status: 'active'
    });
    
    employeeData.user = user._id;
    const employee = new Employee(employeeData);
    await employee.save();
    
    // Emit socket event
    const { io } = await import('../server');
    io.emit('employee:created', employee);
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Error creating employee', error });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    
    // Sync departments array with primary department
    if (updateData.department) {
      const currentEmployee = await Employee.findById(req.params.id);
      if (currentEmployee) {
        const departments = currentEmployee.departments || [];
        if (!departments.includes(updateData.department)) {
          updateData.departments = [...departments, updateData.department];
        }
      }
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Emit socket event
    const { io } = await import('../server');
    io.emit('employee:updated', employee);
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Error updating employee', error });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Delete associated user if exists
    if (employee.user) {
      await User.findByIdAndDelete(employee.user);
    }
    
    await Employee.findByIdAndDelete(req.params.id);
    
    // Emit socket event
    const { io } = await import('../server');
    io.emit('employee:deleted', { id: req.params.id });
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    
    res.json({ message: 'Employee and associated user deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error });
  }
};

export const getEmployeeTasks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    
    // Non-admin users can only see their own tasks
    if (roleName !== 'Root' && roleName !== 'Super Admin') {
      const employee = await Employee.findOne({ user: user._id });
      if (!employee || employee._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Access denied: You can only view your own tasks' });
      }
    }

    const tasks = await Task.find({ assignedTo: req.params.id })
      .populate('project', 'name')
      .populate('assignedBy', 'firstName lastName');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee tasks', error });
  }
};

export const getEmployeeTaskStats = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    
    // Non-admin users can only see their own stats
    if (roleName !== 'Root' && roleName !== 'Super Admin') {
      const employee = await Employee.findOne({ user: user._id });
      if (!employee || employee._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Access denied: You can only view your own statistics' });
      }
    }

    const employeeId = req.params.id;
    const totalTasks = await Task.countDocuments({ assignedTo: employeeId });
    const completedTasks = await Task.countDocuments({ assignedTo: employeeId, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: employeeId, status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({ 
      assignedTo: employeeId,
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });
    
    const stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      todoTasks: await Task.countDocuments({ assignedTo: employeeId, status: 'todo' }),
      reviewTasks: await Task.countDocuments({ assignedTo: employeeId, status: 'review' })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee task stats', error });
  }
};