import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';

export const createPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const payment = new Payment({
      ...req.body,
      createdBy: req.user.id
    });
    
    await payment.save();

    // Update invoice if payment is linked to an invoice
    if (payment.invoiceId) {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.paidAmount += payment.amount;
        invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'sent';
        await invoice.save();
      }
    }
    
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, projectId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;

    const payments = await Payment.find(filter)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('customerId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Payment.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: payments,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('customerId', 'name email')
      .populate('projectId', 'name');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};