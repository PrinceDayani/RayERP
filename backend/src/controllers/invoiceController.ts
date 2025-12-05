import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { JournalEntry } from '../models/JournalEntry';
import { Account } from '../models/Account';
import mongoose from 'mongoose';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoiceData = {
      ...req.body,
      createdBy: req.user.id
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice created successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const {
      status,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate as string);
      if (endDate) filter.issueDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify paid invoice'
      });
    }

    Object.assign(invoice, req.body);
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (['paid', 'sent'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete invoice that has been sent or paid'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markInvoicePaid = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    invoice.paidAmount = invoice.totalAmount;
    invoice.status = 'PAID';
    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice marked as paid successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const remainingAmount = invoice.totalAmount - invoice.paidAmount;
    
    if (amount <= 0 || amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    invoice.paidAmount += amount;

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'PAID';
    }

    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: 'Payment recorded successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be sent'
      });
    }

    invoice.status = 'SENT';
    await invoice.save();

    // Here you would integrate with email service
    // await emailService.sendInvoice(invoice);

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate as string);
      if (endDate) filter.issueDate.$lte = new Date(endDate as string);
    }

    const [summary] = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          overdueCount: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $gt: [{ $subtract: ['$totalAmount', '$paidAmount'] }, 0] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        draftCount: 0,
        sentCount: 0,
        paidCount: 0,
        overdueCount: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export default {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markInvoicePaid,
  recordPayment,
  sendInvoice,
  getInvoiceSummary
};