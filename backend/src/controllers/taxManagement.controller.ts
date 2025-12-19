import { Request, Response } from 'express';
import TaxRecord from '../models/TaxRecord';
import TaxConfig from '../models/TaxConfig';
import mongoose from 'mongoose';

// Get all tax records with pagination and filters
export const getTaxRecords = async (req: Request, res: Response) => {
    try {
        const { type, status, startDate, endDate, page = 1, limit = 50 } = req.query;
        const filter: any = { isDeleted: false };
        
        // Add user filter only if authenticated
        if (req.user?.id) {
            filter.createdBy = req.user.id;
        }

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.dueDate = {};
            if (startDate) filter.dueDate.$gte = new Date(startDate as string);
            if (endDate) filter.dueDate.$lte = new Date(endDate as string);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await TaxRecord.countDocuments(filter);

        const taxRecords = await TaxRecord.find(filter)
            .sort({ dueDate: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('createdBy', 'name email')
            .lean();

        res.json({
            success: true,
            data: taxRecords,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Error fetching tax records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax records'
        });
    }
};

// Get tax liabilities with summary statistics
export const getTaxLiabilities = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const userId = req.user.id;

        const taxRecords = await TaxRecord.find({ createdBy: userId, isDeleted: false })
            .sort({ dueDate: -1 })
            .lean();

        const totalTax = taxRecords.reduce((sum, record) => sum + record.amount, 0);
        const pendingReturns = taxRecords.filter(r => r.status === 'Pending').length;
        const overduePayments = taxRecords.filter(r => r.status === 'Overdue').length;

        const totalRecords = taxRecords.length;
        const filedOrPaid = taxRecords.filter(r => r.status === 'Filed' || r.status === 'Paid').length;
        const complianceScore = totalRecords > 0 ? Math.round((filedOrPaid / totalRecords) * 100) : 100;

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
    } catch (error: any) {
        console.error('Error fetching tax liabilities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax liabilities'
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
            createdBy: req.user.id,
            isDeleted: false
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
    } catch (error: any) {
        console.error('Error fetching tax record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax record'
        });
    }
};

// Create new tax record
export const createTaxRecord = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { type, amount, rate, period, description, dueDate } = req.body;

        const taxRecord = await TaxRecord.create([{
            type,
            amount,
            rate,
            period,
            description,
            dueDate,
            createdBy: req.user?.id || new mongoose.Types.ObjectId()
        }], { session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: taxRecord[0],
            message: 'Tax record created successfully'
        });
    } catch (error: any) {
        await session.abortTransaction();
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
            message: 'Failed to create tax record'
        });
    } finally {
        session.endSession();
    }
};

// Update tax record
export const updateTaxRecord = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tax record ID'
            });
        }

        const filter: any = { _id: id, isDeleted: false };
        if (req.user?.id) {
            filter.createdBy = req.user.id;
        }
        
        const taxRecord = await TaxRecord.findOneAndUpdate(
            filter,
            { ...req.body },
            { new: true, runValidators: true, session }
        );

        if (!taxRecord) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        await session.commitTransaction();

        res.json({
            success: true,
            data: taxRecord,
            message: 'Tax record updated successfully'
        });
    } catch (error: any) {
        await session.abortTransaction();
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
            message: 'Failed to update tax record'
        });
    } finally {
        session.endSession();
    }
};

// Soft delete tax record
export const softDeleteTaxRecord = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tax record ID'
            });
        }

        const filter: any = { _id: id, isDeleted: false };
        if (req.user?.id) {
            filter.createdBy = req.user.id;
        }
        
        const taxRecord = await TaxRecord.findOneAndUpdate(
            filter,
            { 
                isDeleted: true, 
                deletedAt: new Date(),
                deletedBy: req.user?.id
            },
            { new: true, session }
        );

        if (!taxRecord) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Tax record deleted successfully'
        });
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error deleting tax record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete tax record'
        });
    } finally {
        session.endSession();
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
                tdsAmount: Math.round(tdsAmount * 100) / 100,
                netAmount: Math.round(netAmount * 100) / 100
            }
        });
    } catch (error: any) {
        console.error('Error calculating TDS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate TDS'
        });
    }
};

// Calculate Income Tax using dynamic config
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
        if (taxableIncome > 1000000) {
            tax = 112500 + (taxableIncome - 1000000) * 0.3;
        } else if (taxableIncome > 500000) {
            tax = 12500 + (taxableIncome - 500000) * 0.2;
        } else if (taxableIncome > 250000) {
            tax = (taxableIncome - 250000) * 0.05;
        }

        const cess = tax * 0.04; // 4% Health and Education Cess
        const totalTax = tax + cess;

        res.json({
            success: true,
            data: {
                income,
                deductions,
                taxableIncome,
                incomeTax: Math.round(tax * 100) / 100,
                cess: Math.round(cess * 100) / 100,
                totalTax: Math.round(totalTax * 100) / 100,
                netIncome: Math.round((income - totalTax) * 100) / 100
            }
        });
    } catch (error: any) {
        console.error('Error calculating income tax:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate income tax'
        });
    }
};

// Get GST returns
export const getGSTReturns = async (req: Request, res: Response) => {
    try {
        const gstRecords = await TaxRecord.find({
            createdBy: req.user.id,
            type: 'GST',
            isDeleted: false
        }).sort({ dueDate: -1 }).lean();

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
    } catch (error: any) {
        console.error('Error fetching GST returns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GST returns'
        });
    }
};

// Get tax statistics
export const getTaxStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        const taxRecords = await TaxRecord.find({ createdBy: userId, isDeleted: false }).lean();

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
    } catch (error: any) {
        console.error('Error fetching tax stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tax statistics'
        });
    }
};

// Export tax records to CSV
export const exportTaxRecords = async (req: Request, res: Response) => {
    try {
        const { type, status, startDate, endDate } = req.query;
        const filter: any = { createdBy: req.user.id, isDeleted: false };

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.dueDate = {};
            if (startDate) filter.dueDate.$gte = new Date(startDate as string);
            if (endDate) filter.dueDate.$lte = new Date(endDate as string);
        }

        const taxRecords = await TaxRecord.find(filter)
            .sort({ dueDate: -1 })
            .populate('createdBy', 'name email')
            .lean();

        const csv = [
            ['Type', 'Period', 'Amount', 'Rate', 'Status', 'Due Date', 'Description'].join(','),
            ...taxRecords.map(r => [
                r.type,
                r.period,
                r.amount,
                r.rate,
                r.status,
                new Date(r.dueDate).toLocaleDateString(),
                `"${r.description}"`
            ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=tax-records-${Date.now()}.csv`);
        res.send(csv);
    } catch (error: any) {
        console.error('Error exporting tax records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export tax records'
        });
    }
};

// Upload tax document
export const uploadTaxDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const taxRecord = await TaxRecord.findOne({
            _id: id,
            createdBy: req.user.id,
            isDeleted: false
        });

        if (!taxRecord) {
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        if (!taxRecord.attachments) {
            taxRecord.attachments = [];
        }
        
        taxRecord.attachments.push(req.file.filename);
        await taxRecord.save();

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            filename: req.file.filename
        });
    } catch (error: any) {
        console.error('Error uploading tax document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document'
        });
    }
};

// Get tax documents
export const getTaxDocuments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const taxRecord = await TaxRecord.findOne({
            _id: id,
            createdBy: req.user.id,
            isDeleted: false
        });

        if (!taxRecord) {
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        res.json({
            success: true,
            data: taxRecord.attachments || []
        });
    } catch (error: any) {
        console.error('Error fetching tax documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents'
        });
    }
};

// Delete tax document
export const deleteTaxDocument = async (req: Request, res: Response) => {
    try {
        const { id, filename } = req.params;

        const taxRecord = await TaxRecord.findOne({
            _id: id,
            createdBy: req.user.id,
            isDeleted: false
        });

        if (!taxRecord) {
            return res.status(404).json({
                success: false,
                message: 'Tax record not found'
            });
        }

        if (taxRecord.attachments) {
            taxRecord.attachments = taxRecord.attachments.filter(f => f !== filename);
            await taxRecord.save();
        }

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting tax document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document'
        });
    }
};
