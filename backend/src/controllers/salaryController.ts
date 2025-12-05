import { Request, Response } from 'express';
import Employee from '../models/Employee';

/**
 * Get salary information for a specific employee
 * Requires: employees.view_salary permission
 */
export const getEmployeeSalary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findById(id).select('employeeId firstName lastName salary');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    res.json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        salary: employee.salary
      }
    });
  } catch (error: any) {
    console.error('Error fetching employee salary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching salary information',
      error: error.message 
    });
  }
};

/**
 * Update salary for a specific employee
 * Requires: employees.edit_salary permission
 */
export const updateEmployeeSalary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { salary, effectiveDate, reason } = req.body;

    if (!salary || salary < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid salary amount is required' 
      });
    }

    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    const oldSalary = employee.salary;
    employee.salary = salary;
    await employee.save();

    // Log the salary change
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitActivityLog({
      type: 'employee',
      message: `Salary updated for ${employee.firstName} ${employee.lastName} from ${oldSalary} to ${salary}`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { 
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        oldSalary,
        newSalary: salary,
        effectiveDate,
        reason
      }
    });

    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        oldSalary,
        newSalary: salary,
        effectiveDate,
        reason
      }
    });
  } catch (error: any) {
    console.error('Error updating employee salary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating salary information',
      error: error.message 
    });
  }
};

/**
 * Get salary history for an employee (if implemented)
 * Requires: employees.view_salary permission
 */
export const getEmployeeSalaryHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findById(id).select('employeeId firstName lastName salary');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    // Placeholder for salary history - would need a separate SalaryHistory model
    res.json({
      success: true,
      message: 'Salary history feature coming soon',
      data: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        currentSalary: employee.salary,
        history: []
      }
    });
  } catch (error: any) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching salary history',
      error: error.message 
    });
  }
};
