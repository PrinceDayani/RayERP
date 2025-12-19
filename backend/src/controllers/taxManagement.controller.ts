import { Request, Response } from 'express';
import TaxRecord from '../models/TaxRecord';
import mongoose from 'mongoose';

// Get all tax records with optional filters
export const getTaxRecords = async (req: Request, res: Response) => {
    try {
        const { type, status, startDate, endDate } = req.query;
        const filter: any = { createdBy: req.user.id };

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.dueDate = {};
            if (startDate) filter.dueDate.$gte = new Date(startDate as string);
            if (endDate) filter.dueDate.$lte = new Date(endDate as string);
        }

        const taxRecords = await TaxRecord.find(filter)
            .sort({ dueDate: -1 })
            .populate('createdBy', 'name email');

        res.json({
            success: true,
            data: taxRecords,
            total: taxRecords.length
        });
    } catch (error) {
        console.error('Error fetching tax records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax records',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get tax liabilities with summary statistics
export const getTaxLiabilities = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        // Fetch all tax records for the user
        const taxRecords = await TaxRecord.find({ createdBy: userId })
            .sort({ dueDate: -1 });

        // Calculate summary statistics
        const totalTax = taxRecords.reduce((sum, record) => sum + record.amount, 0);
        const pendingReturns = taxRecords.filter(r => r.status === 'Pending').length;
        const overduePayments = taxRecords.filter(r => r.status === 'Overdue').length;

        // Calculate compliance score (simple metric)
        const totalRecords = taxRecords.length;
        const filedOrPaid = taxRecords.filter(r => r.status === 'Filed' || r.status === 'Paid').length;
        const complianceScore = totalRecords > 0
            ? Math.round((filedOrPaid / totalRecords) * 100)
            : 100;

        res.json({
            success: true,
            data: {
                records: taxRecords,
                summary: {
                    totalTax,
                    pendingReturns,
                    overduePayments,
                    complianceScore
                }
            },
            total: taxRecords.length
        });
    } catch (error) {
        console.error('Error fetching tax liabilities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax liabilities',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get single tax record by ID
export const getTaxById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tax record ID'
            });
        }

        const taxRecord = await TaxRecord.findOne({
            _id: id,
            createdBy: req.user.id
        }).populate('createdBy', 'name email');

        if (!taxRecord) {
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        res.json({
            success: true,
            data: taxRecord
        });
    } catch (error) {
        console.error('Error fetching tax record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create new tax record
export const createTaxRecord = async (req: Request, res: Response) => {
    try {
        const { type, amount, rate, period, description, dueDate } = req.body;

        const taxRecord = await TaxRecord.create({
            type,
            amount,
            rate,
            period,
            description,
            dueDate,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: taxRecord,
            message: 'Tax record created successfully'
        });
    } catch (error: any) {
        console.error('Error creating tax record:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map((err: any) => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create tax record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update tax record
export const updateTaxRecord = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tax record ID'
            });
        }

        const taxRecord = await TaxRecord.findOneAndUpdate(
            { _id: id, createdBy: req.user.id },
            { ...req.body },
            { new: true, runValidators: true }
        );

        if (!taxRecord) {
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        res.json({
            success: true,
            data: taxRecord,
            message: 'Tax record updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating tax record:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map((err: any) => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update tax record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete tax record
export const deleteTaxRecord = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tax record ID'
            });
        }

        const taxRecord = await TaxRecord.findOneAndDelete({
            _id: id,
            createdBy: req.user.id
        });

        if (!taxRecord) {
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        res.json({
            success: true,
            message: 'Tax record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting tax record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete tax record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Calculate TDS
export const calculateTDS = async (req: Request, res: Response) => {
    try {
        const { amount, rate } = req.body;

        if (!amount || !rate) {
            return res.status(400).json({
                success: false,
                message: 'Amount and rate are required'
            });
        }

        const tdsAmount = (amount * rate) / 100;
        const netAmount = amount - tdsAmount;

        res.json({
            success: true,
            data: {
                grossAmount: amount,
                tdsRate: rate,
                tdsAmount,
                netAmount
            }
        });
    } catch (error) {
        console.error('Error calculating TDS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate TDS',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Calculate Income Tax
export const calculateIncomeTax = async (req: Request, res: Response) => {
    try {
        const { income, deductions = 0 } = req.body;

        if (!income) {
            return res.status(400).json({
                success: false,
                message: 'Income is required'
            });
        }

        const taxableIncome = income - deductions;

        let tax = 0;
        // FY 2023-24 Tax Slabs
        if (taxableIncome > 1000000) {
            tax = 112500 + (taxableIncome - 1000000) * 0.3;
        } else if (taxableIncome > 500000) {
            tax = 12500 + (taxableIncome - 500000) * 0.2;
        } else if (taxableIncome > 250000) {
            tax = (taxableIncome - 250000) * 0.05;
        }

        res.json({
            success: true,
            data: {
                grossIncome: income,
                deductions,
                taxableIncome,
                calculatedTax: Math.round(tax),
                netIncome: income - Math.round(tax)
            }
        });
    } catch (error) {
        console.error('Error calculating income tax:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate income tax',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get GST returns
export const getGSTReturns = async (req: Request, res: Response) => {
    try {
        const gstRecords = await TaxRecord.find({
            createdBy: req.user.id,
            type: 'GST'
        }).sort({ dueDate: -1 });

        // Group by return type (this is simplified - in production you'd have more complex logic)
        const gstReturns = [
            {
                type: 'GSTR-1',
                status: 'Filed',
                dueDate: '2024-01-11',
                period: 'Dec 2023',
                records: gstRecords.filter(r => r.status === 'Filed').length
            },
            {
                type: 'GSTR-3B',
                status: 'Pending',
                dueDate: '2024-01-20',
                period: 'Dec 2023',
                records: gstRecords.filter(r => r.status === 'Pending').length
            },
            {
                type: 'GSTR-9',
                status: 'Due Soon',
                dueDate: '2024-03-31',
                period: 'FY 2023-24',
                records: gstRecords.length
            }
        ];

        res.json({
            success: true,
            data: gstReturns
        });
    } catch (error) {
        console.error('Error fetching GST returns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GST returns',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get tax statistics
export const getTaxStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        const taxRecords = await TaxRecord.find({ createdBy: userId });

        const stats = {
            totalTax: taxRecords.reduce((sum, record) => sum + record.amount, 0),
            pendingReturns: taxRecords.filter(r => r.status === 'Pending').length,
            overduePayments: taxRecords.filter(r => r.status === 'Overdue').length,
            complianceScore: taxRecords.length > 0
                ? Math.round((taxRecords.filter(r => r.status === 'Filed' || r.status === 'Paid').length / taxRecords.length) * 100)
                : 100
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching tax stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
