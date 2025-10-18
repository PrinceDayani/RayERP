import { Request, Response } from 'express';
import Invoice from '../models/Invoice';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const invoice = new Invoice({
      ...req.body,
      createdBy: req.user.id
    });
    
    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, projectId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;

    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Invoice.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: invoices,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('projectId', 'name');
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
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markInvoicePaid = async (req: Request, res: Response) => {
  try {
    const { paidAmount } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.paidAmount = paidAmount;
    invoice.status = paidAmount >= invoice.totalAmount ? 'paid' : 'sent';
    await invoice.save();
    
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};