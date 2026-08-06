import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Task from '../models/Task';
import User from '../models/User';
import { Role } from '../models/Role';
import Department from '../models/Department';
import { logger } from '../utils/logger';
// Socket will be imported dynamically to avoid circular dependency

// Helper function to check user permissions
const checkUserPermission = async (user: any, permission: string): Promise<boolean> => {
  if (!user) return false;
  
  try {
    const userDoc = await User.findById(user.id).populate('role');
    if (!userDoc) return false;
    
    const userRole = userDoc.role as any;
    
    const userPermissions = new Set<string>();
    
    // Check for wildcard permission (*)
    if (userRole?.permissions && userRole.permissions.includes('*')) {
      return true;
    }
    
    // Add role permissions
    if (userRole?.permissions) {
      userRole.permissions.forEach((perm: string) => userPermissions.add(perm));
    }
    
    // Add department permissions
    const employee = await Employee.findOne({ email: userDoc.email });
    if (employee) {
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
      if (departmentNames.length > 0) {
        const departments = await Department.find({ 
          name: { $in: departmentNames },
          status: 'active'
        });
        departments.forEach(dept => {
          if (dept.permissions && dept.permissions.length > 0) {
            dept.permissions.forEach((perm: string) => userPermissions.add(perm));
          }
        });
      }
    }
    
    return userPermissions.has(permission);
  } catch (error) {
    logger.error('Error checking permission', { message: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
};

// Pay and banking columns are permission-gated; everything else in the record
// is visible to anyone holding employees.view.
const sanitizeEmployee = (employee: any, hasViewSalary: boolean, hasViewBank: boolean) => {
  const empObj = typeof employee.toObject === 'function' ? employee.toObject() : employee;
  if (!hasViewSalary) {
    delete empObj.salary;
    delete empObj.compensation;
    delete empObj.salaryHistory;
  }
  if (!hasViewBank) {
    delete empObj.bankDetails;
    if (empObj.statutory) {
      const { uanNumber, ...rest } = empObj.statutory;
      empObj.statutory = rest;
    }
  }
  return empObj;
};

// Escape user input before it reaches a $regex operator.
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const hasViewSalary = await checkUserPermission(user, 'employees.view_salary');
    const hasViewBank = await checkUserPermission(user, 'employees.view_bank_details');

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const department = req.query.department as string;
    const workLocation = req.query.workLocation as string;
    const projectAssignment = req.query.projectAssignment as string;
    const employmentCategory = req.query.employmentCategory as string;

    // Build query
    const query: any = {};
    const and: any[] = [];
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      and.push({
        $or: [
          { firstName: rx },
          { lastName: rx },
          { email: rx },
          { employeeId: rx },
          { position: rx },
          { workLocation: rx },
          { projectAssignment: rx },
          { reportingAuthority: rx }
        ]
      });
    }
    if (status) query.status = status;
    if (department) {
      and.push({ $or: [{ department }, { departments: department }] });
    }
    if (workLocation) query.workLocation = workLocation;
    if (projectAssignment) query.projectAssignment = projectAssignment;
    if (employmentCategory) query.employmentCategory = employmentCategory;
    if (and.length) query.$and = and;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('manager', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const sanitizedEmployees = employees.map(emp => sanitizeEmployee(emp, hasViewSalary, hasViewBank));

    res.json({
      success: true,
      data: sanitizedEmployees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const hasViewSalary = await checkUserPermission(user, 'employees.view_salary');
    const hasViewBank = await checkUserPermission(user, 'employees.view_bank_details');

    const employee = await Employee.findById(req.params.id).populate('manager', 'firstName lastName');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: sanitizeEmployee(employee, hasViewSalary, hasViewBank) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee' });
  }
};

// Distinct values backing the directory filter dropdowns.
export const getEmployeeFilterOptions = async (_req: Request, res: Response) => {
  try {
    const [workLocations, projectAssignments, employmentCategories] = await Promise.all([
      Employee.distinct('workLocation'),
      Employee.distinct('projectAssignment'),
      Employee.distinct('employmentCategory')
    ]);

    const clean = (values: any[]) => values.filter((v): v is string => typeof v === 'string' && v.length > 0).sort();

    res.json({
      success: true,
      data: {
        workLocations: clean(workLocations),
        projectAssignments: clean(projectAssignments),
        employmentCategories: clean(employmentCategories)
      }
    });
  } catch (error: any) {
    logger.error('Error fetching employee filter options', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching filter options' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const employeeData = req.body;

    // Same gates the update path applies, so create cannot be used to set
    // pay or banking fields the caller is not cleared for.
    if (employeeData.salary !== undefined || employeeData.compensation !== undefined) {
      const hasEditSalary = await checkUserPermission(req.user, 'employees.edit_salary');
      if (!hasEditSalary) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to set salary',
          required: 'employees.edit_salary'
        });
      }
    }
    if (employeeData.bankDetails !== undefined || employeeData.statutory !== undefined) {
      const hasEditBank = await checkUserPermission(req.user, 'employees.edit_bank_details');
      if (!hasEditBank) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to set bank or statutory details',
          required: 'employees.edit_bank_details'
        });
      }
    }

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
        return res.status(500).json({ success: false, message: 'Failed to generate unique employee ID. Please try again.' });
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
      return res.status(400).json({ success: false, message: 'Normal role not found. Please ensure roles are seeded.' });
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
      return res.status(400).json({ success: false, message: 'Failed to create user' });
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
      
      res.status(201).json({ success: true, data: employee });
    } catch (employeeError: any) {
      await User.findByIdAndDelete(user._id);
      
      // Handle duplicate key errors
      if (employeeError.code === 11000) {
        const field = Object.keys(employeeError.keyPattern || {})[0];
        return res.status(400).json({
          success: false,
          message: `Employee with this ${field} already exists. Please use a different ${field}.`
        });
      }
      throw employeeError;
    }
  } catch (error: any) {
    // Handle duplicate key errors at top level
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `Employee with this ${field} already exists. Please use a different ${field}.`
      });
    }
    res.status(400).json({ success: false, message: 'Error creating employee' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const updateData = req.body;
    
    // Check if salary is being updated
    if (updateData.salary !== undefined || updateData.compensation !== undefined || updateData.salaryHistory !== undefined) {
      const hasEditSalary = await checkUserPermission(user, 'employees.edit_salary');
      if (!hasEditSalary) {
        return res.status(403).json({
          message: 'Insufficient permissions to edit salary',
          required: 'employees.edit_salary'
        });
      }
    }

    if (updateData.bankDetails !== undefined || updateData.statutory !== undefined) {
      const hasEditBank = await checkUserPermission(user, 'employees.edit_bank_details');
      if (!hasEditBank) {
        return res.status(403).json({
          message: 'Insufficient permissions to edit bank or statutory details',
          required: 'employees.edit_bank_details'
        });
      }
    }

    if (updateData.user === null || updateData.user === undefined || updateData.user === '') {
      return res.status(400).json({ success: false, message: 'Employee must have an associated user' });
    }
    
    if (updateData.user) {
      const userExists = await User.findById(updateData.user);
      if (!userExists) {
        return res.status(400).json({ success: false, message: 'User does not exist' });
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
      return res.status(404).json({ success: false, message: 'Employee not found' });
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
    
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Error updating employee' });
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

    // Resolve the target employee to its User identity; Task.assignedTo refs User, not Employee.
    const targetEmployee = await Employee.findById(req.params.id).select('user');
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Non-admin users can only see their own tasks
    if (roleName !== 'Root' && roleName !== 'Super Admin') {
      const employee = await Employee.findOne({ user: user._id });
      if (!employee || employee._id.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own tasks' });
      }
    }

    const tasks = await Task.find({ assignedTo: targetEmployee.user })
      .populate('project', 'name')
      .populate('assignedBy', 'name email');
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee tasks' });
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
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own statistics' });
      }
    }

    const employeeId = req.params.id;
    const total = await Task.countDocuments({ assignedTo: employeeId });
    const completed = await Task.countDocuments({ assignedTo: employeeId, status: 'completed' });
    const inProgress = await Task.countDocuments({ assignedTo: employeeId, status: 'in-progress' });
    const overdue = await Task.countDocuments({ 
      assignedTo: employeeId,
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });
    
    const stats = {
      total,
      completed,
      inProgress,
      overdue
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee task stats' });
  }
};