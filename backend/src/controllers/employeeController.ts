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
    
    // Generate unique employeeId with retry logic
    let nextId: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const lastEmployee = await Employee.findOne().sort({ createdAt: -1, employeeId: -1 }).limit(1);
      const lastIdNum = lastEmployee ? parseInt(lastEmployee.employeeId.replace(/\D/g, '')) : 0;
      nextId = `EMP${(lastIdNum + 1).toString().padStart(4, '0')}`;
      
      // Check if ID already exists
      const exists = await Employee.findOne({ employeeId: nextId });
      if (!exists) break;
      
      attempts++;
      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: 'Failed to generate unique employee ID. Please try again.' });
      }
    }
    
    employeeData.employeeId = nextId;
    
    if (employeeData.department && !employeeData.departments) {
      employeeData.departments = [employeeData.department];
    } else if (employeeData.department && employeeData.departments && !employeeData.departments.includes(employeeData.department)) {
      employeeData.departments.push(employeeData.department);
    }
    
    const normalRole = await Role.findOne({ name: 'Normal' });
    if (!normalRole) {
      return res.status(400).json({ message: 'Normal role not found. Please ensure roles are seeded.' });
    }
    
    // Automatically create user for employee
    let user;
    try {
      user = await User.create({
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        email: employeeData.email,
        password: employeeData.employeeId,
        role: normalRole._id,
        status: 'active'
      });
    } catch (userError: any) {
      return res.status(400).json({ message: 'Failed to create user', error: userError.message });
    }
    
    employeeData.user = user._id;
    
    try {
      const employee = new Employee(employeeData);
      await employee.save();
      
      const { io } = await import('../server');
      io.emit('employee:created', employee);
      
      const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
      await RealTimeEmitter.emitDashboardStats();
      await RealTimeEmitter.emitActivityLog({
        type: 'employee',
        message: `New employee ${employee.firstName} ${employee.lastName} added`,
        user: req.user?.name || 'System',
        userId: req.user?._id?.toString(),
        metadata: { employeeId: employee._id, employeeName: `${employee.firstName} ${employee.lastName}` }
      });
      
      res.status(201).json(employee);
    } catch (employeeError: any) {
      await User.findByIdAndDelete(user._id);
      
      // Handle duplicate key errors
      if (employeeError.code === 11000) {
        const field = Object.keys(employeeError.keyPattern || {})[0];
        return res.status(400).json({ 
          message: `Employee with this ${field} already exists. Please use a different ${field}.`,
          error: employeeError.message 
        });
      }
      throw employeeError;
    }
  } catch (error: any) {
    // Handle duplicate key errors at top level
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({ 
        message: `Employee with this ${field} already exists. Please use a different ${field}.`,
        error: error.message 
      });
    }
    res.status(400).json({ message: 'Error creating employee', error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    
    if (updateData.user === null || updateData.user === undefined || updateData.user === '') {
      return res.status(400).json({ message: 'Employee must have an associated user' });
    }
    
    if (updateData.user) {
      const userExists = await User.findById(updateData.user);
      if (!userExists) {
        return res.status(400).json({ message: 'User does not exist' });
      }
    }
    
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
    
    // Sync user data with employee data
    if (employee.user && (updateData.firstName || updateData.lastName || updateData.email)) {
      const userUpdate: any = {};
      if (updateData.firstName || updateData.lastName) {
        userUpdate.name = `${employee.firstName} ${employee.lastName}`;
      }
      if (updateData.email) {
        userUpdate.email = employee.email;
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(employee.user, userUpdate);
      }
    }
    
    const { io } = await import('../server');
    io.emit('employee:updated', employee);
    
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'employee',
      message: `Employee ${employee.firstName} ${employee.lastName} updated`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { employeeId: employee._id, employeeName: `${employee.firstName} ${employee.lastName}` }
    });
    
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating employee', error: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);
    
    const { io } = await import('../server');
    io.emit('employee:deleted', { id: req.params.id });
    
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'employee',
      message: `Employee ${employee.firstName} ${employee.lastName} deleted`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { employeeId: employee._id, employeeName: `${employee.firstName} ${employee.lastName}` }
    });
    
    res.json({ message: 'Employee and associated user deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
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