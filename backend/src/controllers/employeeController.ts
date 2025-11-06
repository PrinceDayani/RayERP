import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Task from '../models/Task';
// Socket will be imported dynamically to avoid circular dependency

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find().populate('manager', 'firstName lastName');
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employees', error });
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
    const employee = new Employee(employeeData);
    await employee.save();
    
    // Emit socket event
    const { io } = await import('../server');
    io.emit('employee:created', employee);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Error creating employee', error });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Emit socket event
    const { io } = await import('../server');
    io.emit('employee:updated', employee);
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Error updating employee', error });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Emit socket event
    const { io } = await import('../server');
    io.emit('employee:deleted', { id: req.params.id });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error });
  }
};

export const getEmployeeTasks = async (req: Request, res: Response) => {
  try {
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