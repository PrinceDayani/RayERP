import mongoose from 'mongoose';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class GLValidation {
  // Validate ObjectId
  static validateObjectId(id: string, fieldName: string = 'ID'): ValidationResult {
    const errors: string[] = [];
    
    if (!id) {
      errors.push(`${fieldName} is required`);
    } else if (!mongoose.Types.ObjectId.isValid(id)) {
      errors.push(`Invalid ${fieldName} format`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate account group data
  static validateAccountGroup(data: any): ValidationResult {
    const errors: string[] = [];
    
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      errors.push('Code is required and must be a non-empty string');
    }
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.type || !['assets', 'liabilities', 'income', 'expenses'].includes(data.type)) {
      errors.push('Type must be one of: assets, liabilities, income, expenses');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate account sub-group data
  static validateAccountSubGroup(data: any): ValidationResult {
    const errors: string[] = [];
    
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      errors.push('Code is required and must be a non-empty string');
    }
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.groupId) {
      errors.push('Group ID is required');
    } else {
      const groupIdValidation = this.validateObjectId(data.groupId, 'Group ID');
      if (!groupIdValidation.isValid) {
        errors.push(...groupIdValidation.errors);
      }
    }
    
    if (data.parentSubGroupId) {
      const parentValidation = this.validateObjectId(data.parentSubGroupId, 'Parent Sub-Group ID');
      if (!parentValidation.isValid) {
        errors.push(...parentValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate ledger data
  static validateLedger(data: any): ValidationResult {
    const errors: string[] = [];
    
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      errors.push('Code is required and must be a non-empty string');
    }
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.accountId) {
      errors.push('Account ID is required');
    } else {
      const accountIdValidation = this.validateObjectId(data.accountId, 'Account ID');
      if (!accountIdValidation.isValid) {
        errors.push(...accountIdValidation.errors);
      }
    }
    
    if (data.openingBalance !== undefined && (isNaN(Number(data.openingBalance)))) {
      errors.push('Opening balance must be a valid number');
    }
    
    if (data.balanceType && !['debit', 'credit'].includes(data.balanceType)) {
      errors.push('Balance type must be either "debit" or "credit"');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate journal entry data
  static validateJournalEntry(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Validate date
    if (!data.date) {
      errors.push('Date is required');
    } else {
      const entryDate = new Date(data.date);
      if (isNaN(entryDate.getTime())) {
        errors.push('Invalid date format');
      }
    }
    
    // Validate description
    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
      errors.push('Description is required and must be a non-empty string');
    }
    
    // Validate lines
    if (!data.lines || !Array.isArray(data.lines)) {
      errors.push('Lines must be an array');
    } else if (data.lines.length < 2) {
      errors.push('At least 2 lines are required for double-entry bookkeeping');
    } else {
      // Validate each line
      let totalDebit = 0;
      let totalCredit = 0;
      
      data.lines.forEach((line: any, index: number) => {
        const lineErrors = this.validateJournalLine(line, index + 1);
        errors.push(...lineErrors.errors);
        
        if (lineErrors.isValid) {
          totalDebit += Number(line.debit) || 0;
          totalCredit += Number(line.credit) || 0;
        }
      });
      
      // Check if entry is balanced
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.push(`Journal entry is not balanced. Total debits: ${totalDebit.toFixed(2)}, Total credits: ${totalCredit.toFixed(2)}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate journal line data
  static validateJournalLine(data: any, lineNumber: number): ValidationResult {
    const errors: string[] = [];
    
    // Validate account ID
    if (!data.accountId) {
      errors.push(`Line ${lineNumber}: Account ID is required`);
    } else {
      const accountIdValidation = this.validateObjectId(data.accountId, `Line ${lineNumber} Account ID`);
      if (!accountIdValidation.isValid) {
        errors.push(...accountIdValidation.errors);
      }
    }
    
    // Validate amounts
    const debit = Number(data.debit) || 0;
    const credit = Number(data.credit) || 0;
    
    if (debit < 0 || credit < 0) {
      errors.push(`Line ${lineNumber}: Amounts cannot be negative`);
    }
    
    if (debit === 0 && credit === 0) {
      errors.push(`Line ${lineNumber}: Either debit or credit amount must be greater than zero`);
    }
    
    if (debit > 0 && credit > 0) {
      errors.push(`Line ${lineNumber}: A line cannot have both debit and credit amounts`);
    }
    
    // Validate description
    if (data.description && typeof data.description !== 'string') {
      errors.push(`Line ${lineNumber}: Description must be a string`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate account data
  static validateAccount(data: any): ValidationResult {
    const errors: string[] = [];
    
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      errors.push('Code is required and must be a non-empty string');
    }
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.type || !['asset', 'liability', 'equity', 'revenue', 'expense'].includes(data.type)) {
      errors.push('Type must be one of: asset, liability, equity, revenue, expense');
    }
    
    if (data.balance !== undefined && isNaN(Number(data.balance))) {
      errors.push('Balance must be a valid number');
    }
    
    if (data.parentId) {
      const parentIdValidation = this.validateObjectId(data.parentId, 'Parent ID');
      if (!parentIdValidation.isValid) {
        errors.push(...parentIdValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize string input
  static sanitizeString(input: any): string {
    if (typeof input !== 'string') {
      return String(input || '').trim();
    }
    return input.trim();
  }

  // Sanitize number input
  static sanitizeNumber(input: any, defaultValue: number = 0): number {
    const num = Number(input);
    return isNaN(num) ? defaultValue : num;
  }

  // Validate date range
  static validateDateRange(startDate?: string, endDate?: string): ValidationResult {
    const errors: string[] = [];
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date format');
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          errors.push('Invalid end date format');
        } else if (start > end) {
          errors.push('Start date cannot be after end date');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate pagination parameters
  static validatePagination(page?: any, limit?: any): ValidationResult {
    const errors: string[] = [];
    
    if (page !== undefined) {
      const pageNum = Number(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('Page must be a positive integer');
      }
    }
    
    if (limit !== undefined) {
      const limitNum = Number(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push('Limit must be between 1 and 100');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default GLValidation;