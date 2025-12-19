export const validateAccount = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push('Account name is required');
    }

    if (!data.code || data.code.trim().length === 0) {
        errors.push('Account code is required');
    }

    if (!data.type) {
        errors.push('Account type is required');
    } else if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(data.type)) {
        errors.push('Invalid account type');
    }

    // Validate GST number format (if provided)
    if (data.taxInfo?.gstNo) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(data.taxInfo.gstNo)) {
            errors.push('Invalid GST number format');
        }
    }

    // Validate PAN number format (if provided)
    if (data.taxInfo?.panNo) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(data.taxInfo.panNo)) {
            errors.push('Invalid PAN number format');
        }
    }

    // Validate IFSC code format (if provided)
    if (data.bankDetails?.ifscCode) {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(data.bankDetails.ifscCode)) {
            errors.push('Invalid IFSC code format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateJournalEntry = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.date) {
        errors.push('Date is required');
    }

    if (!data.description || data.description.trim().length === 0) {
        errors.push('Description is required');
    }

    if (!data.lines || data.lines.length === 0) {
        errors.push('At least one entry line is required');
    } else {
        // Validate each line
        data.lines.forEach((line: any, index: number) => {
            if (!line.accountId) {
                errors.push(`Line ${index + 1}: Account is required`);
            }

            const debit = parseFloat(line.debit) || 0;
            const credit = parseFloat(line.credit) || 0;

            if (debit === 0 && credit === 0) {
                errors.push(`Line ${index + 1}: Either debit or credit must be greater than 0`);
            }

            if (debit !== 0 && credit !== 0) {
                errors.push(`Line ${index + 1}: Cannot have both debit and credit`);
            }
        });

        // Validate balanced entry
        const totalDebit = data.lines.reduce((sum: number, line: any) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredit = data.lines.reduce((sum: number, line: any) => sum + (parseFloat(line.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            errors.push(`Entry is not balanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateVoucher = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.voucherType) {
        errors.push('Voucher type is required');
    }

    if (!data.date) {
        errors.push('Date is required');
    }

    if (!data.narration || data.narration.trim().length === 0) {
        errors.push('Narration is required');
    }

    if (!data.lines || data.lines.length === 0) {
        errors.push('At least one transaction line is required');
    } else {
        // Validate lines
        data.lines.forEach((line: any, index: number) => {
            if (!line.accountId) {
                errors.push(`Line ${index + 1}: Account is required`);
            }

            const debit = parseFloat(line.debit) || 0;
            const credit = parseFloat(line.credit) || 0;

            if (debit === 0 && credit === 0) {
                errors.push(`Line ${index + 1}: Amount is required`);
            }
        });

        // Validate balanced entry
        const totalDebit = data.lines.reduce((sum: number, line: any) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredit = data.lines.reduce((sum: number, line: any) => sum + (parseFloat(line.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            errors.push(`Voucher is not balanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`);
        }
    }

    // Type-specific validations
    if (['payment', 'receipt'].includes(data.voucherType)) {
        if (!data.partyName || data.partyName.trim().length === 0) {
            errors.push('Party name is required for payment/receipt vouchers');
        }

        if (data.paymentMode === 'cheque') {
            if (!data.chequeNumber) {
                errors.push('Cheque number is required');
            }
            if (!data.chequeDate) {
                errors.push('Cheque date is required');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const formatValidationErrors = (errors: string[]): string => {
    return errors.join('\n');
};

// ==================== TRANSACTION-SPECIFIC VALIDATORS ====================

// Bill Validation
export const validateBill = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.vendor || data.vendor.trim().length === 0) {
        errors.push('Vendor name is required');
    }

    if (!data.billDate) {
        errors.push('Bill date is required');
    }

    if (!data.dueDate) {
        errors.push('Due date is required');
    } else if (data.billDate && new Date(data.dueDate) < new Date(data.billDate)) {
        errors.push('Due date cannot be before bill date');
    }

    if (!data.billNumber || data.billNumber.trim().length === 0) {
        errors.push('Bill number is required');
    }

    const totalAmount = parseFloat(data.totalAmount) || 0;
    if (totalAmount <= 0) {
        errors.push('Total amount must be greater than 0');
    }

    // Validate line items if present
    if (data.lineItems && data.lineItems.length > 0) {
        const lineTotal = data.lineItems.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
        if (Math.abs(lineTotal - totalAmount) > 0.01) {
            errors.push('Line items total does not match bill total');
        }
    }

    return { isValid: errors.length === 0, errors };
};

// Invoice Validation
export const validateInvoice = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.customerName || data.customerName.trim().length === 0) {
        errors.push('Customer name is required');
    }

    if (!data.issueDate) {
        errors.push('Issue date is required');
    }

    if (!data.dueDate) {
        errors.push('Due date is required');
    } else if (data.issueDate && new Date(data.dueDate) < new Date(data.issueDate)) {
        errors.push('Due date cannot be before issue date');
    }

    // Validate line items
    if (!data.items || data.items.length === 0) {
        errors.push('At least one line item is required');
    } else {
        data.items.forEach((item: any, index: number) => {
            if (!item.description || item.description.trim().length === 0) {
                errors.push(`Line ${index + 1}: Description is required`);
            }

            const quantity = parseFloat(item.quantity) || 0;
            if (quantity <= 0) {
                errors.push(`Line ${index + 1}: Quantity must be greater than 0`);
            }

            const unitPrice = parseFloat(item.unitPrice) || 0;
            if (unitPrice <= 0) {
                errors.push(`Line ${index + 1}: Unit price must be greater than 0`);
            }

            // Validate GST rate if applicable
            if (item.gstRate !== undefined) {
                const gst = parseFloat(item.gstRate);
                if (gst < 0 || gst > 28) {
                    errors.push(`Line ${index + 1}: GST rate must be between 0% and 28%`);
                }
            }
        });
    }

    // Validate GST number format if provided
    if (data.gstNo) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\$/;
        if (!gstRegex.test(data.gstNo)) {
            errors.push('Invalid GST number format (must be 15 characters)');
        }
    }

    return { isValid: errors.length === 0, errors };
};

// Payment Validation
export const validatePayment = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.customerName || data.customerName.trim().length === 0) {
        errors.push('Customer/Vendor name is required');
    }

    if (!data.paymentDate) {
        errors.push('Payment date is required');
    }

    const totalAmount = parseFloat(data.totalAmount) || 0;
    if (totalAmount <= 0) {
        errors.push('Payment amount must be greater than 0');
    }

    if (!data.paymentMethod) {
        errors.push('Payment method is required');
    } else {
        const validMethods = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NEFT', 'RTGS'];
        if (!validMethods.includes(data.paymentMethod)) {
            errors.push('Invalid payment method');
        }

        // Method-specific validations
        if (data.paymentMethod === 'CHEQUE' && !data.reference) {
            errors.push('Cheque number is required for cheque payments');
        }

        if (['NEFT', 'RTGS', 'BANK_TRANSFER'].includes(data.paymentMethod) && !data.reference) {
            errors.push('Transaction reference is required for bank transfers');
        }
    }

    // Currency validation
    if (data.currency) {
        const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
        if (!validCurrencies.includes(data.currency)) {
            errors.push('Invalid currency');
        }

        if (data.currency !== 'INR') {
            const exchangeRate = parseFloat(data.exchangeRate) || 0;
            if (exchangeRate <= 0) {
                errors.push('Exchange rate is required for foreign currency payments');
            }
        }
    }

    // Validate allocations if provided
    if (data.allocations && data.allocations.length > 0) {
        const allocatedTotal = data.allocations.reduce((sum: number, alloc: any) => sum + (parseFloat(alloc.amount) || 0), 0);
        if (Math.abs(allocatedTotal - totalAmount) > 0.01) {
            errors.push(`Allocated amount (${allocatedTotal.toFixed(2)}) does not match total payment (${totalAmount.toFixed(2)})`);
        }
    }

    return { isValid: errors.length === 0, errors };
};

// Recurring Entry Validation
export const validateRecurringEntry = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push('Entry name is required');
    }

    if (!data.frequency) {
        errors.push('Frequency is required');
    } else {
        const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
        if (!validFrequencies.includes(data.frequency)) {
            errors.push('Invalid frequency');
        }
    }

    if (!data.startDate) {
        errors.push('Start date is required');
    }

    if (data.endDate && new Date(data.endDate) < new Date(data.startDate || new Date())) {
        errors.push('End date cannot be before start date');
    }

    // Validate entries (journal lines)
    if (!data.entries || data.entries.length === 0) {
        errors.push('At least one journal entry line is required');
    } else {
        data.entries.forEach((entry: any, index: number) => {
            if (!entry.accountId) {
                errors.push(`Line ${index + 1}: Account is required`);
            }

            const debit = parseFloat(entry.debit) || 0;
            const credit = parseFloat(entry.credit) || 0;

            if (debit === 0 && credit === 0) {
                errors.push(`Line ${index + 1}: Either debit or credit must be greater than 0`);
            }

            if (debit !== 0 && credit !== 0) {
                errors.push(`Line ${index + 1}: Cannot have both debit and credit`);
            }

            if (debit < 0 || credit < 0) {
                errors.push(`Line ${index + 1}: Amounts cannot be negative`);
            }
        });

        // Validate balanced entry
        const totalDebit = data.entries.reduce((sum: number, entry: any) => sum + (parseFloat(entry.debit) || 0), 0);
        const totalCredit = data.entries.reduce((sum: number, entry: any) => sum + (parseFloat(entry.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            errors.push(`Entry is not balanced. Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}`);
        }

        if (totalDebit === 0 && totalCredit === 0) {
            errors.push('Entry total cannot be zero');
        }
    }

    return { isValid: errors.length === 0, errors };
};

// Helper function - Validate Indian tax formats
export const validateGSTNumber = (gstNo: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\$/;
    return gstRegex.test(gstNo);
};

export const validatePANNumber = (panNo: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}\$/;
    return panRegex.test(panNo);
};

export const validateIFSCCode = (ifscCode: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}\$/;
    return ifscRegex.test(ifscCode);
};
