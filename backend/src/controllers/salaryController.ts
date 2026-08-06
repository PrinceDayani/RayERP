import { Request, Response } from 'express';
import Employee from '../models/Employee';
import { logger } from '../utils/logger';

/**
 * Get salary information for a specific employee
 * Requires: employees.view_salary permission
 */
export const getEmployeeSalary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findById(id)
      .select('employeeId firstName lastName salary compensation employmentCategory');

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
        salary: employee.salary,
        employmentCategory: employee.employmentCategory,
        compensation: employee.compensation
      }
    });
  } catch (error: any) {
    logger.error('Error fetching employee salary', { message: error?.message });
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

    // Keep the monthly breakdown and the revision trail in step with the annual figure.
    const monthlyGross = Math.round(salary / 12);
    const effectiveFrom = effectiveDate ? new Date(effectiveDate) : new Date();
    employee.compensation = { ...(employee.compensation || {}), monthlyGross, effectiveFrom };
    employee.salaryHistory = [
      ...(employee.salaryHistory || []),
      {
        effectiveFrom,
        label: effectiveFrom.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        monthlyGross,
        reason,
        recordedBy: req.user?._id,
        recordedAt: new Date()
      }
    ].sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime());

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
    logger.error('Error updating employee salary', { message: error?.message });
    res.status(500).json({ 
      success: false,
      message: 'Error updating salary information',
      error: error.message 
    });
  }
};

/**
 * Get the salary revision trail for an employee
 * Requires: employees.view_salary permission
 */
export const getEmployeeSalaryHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .select('employeeId firstName lastName salary compensation salaryHistory')
      .populate('salaryHistory.recordedBy', 'name email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const history = [...(employee.salaryHistory || [])]
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

    res.json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        currentSalary: employee.salary,
        compensation: employee.compensation,
        history
      }
    });
  } catch (error: any) {
    logger.error('Error fetching salary history', { message: error?.message });
    res.status(500).json({ 
      success: false,
      message: 'Error fetching salary history',
      error: error.message 
    });
  }
};
