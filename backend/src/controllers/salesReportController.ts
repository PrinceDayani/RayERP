import { Request, Response } from 'express';
import Invoice from '../models/Invoice';

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, customerId } = req.query;

    const filter: any = { invoiceType: 'SALES' };
    if (status && status !== 'all') filter.status = status.toString().toUpperCase();
    if (customerId) filter.customerId = customerId;
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate as string);
    }

    const sales = await Invoice.find(filter)
      .populate('customerId', 'name email')
      .sort({ invoiceDate: -1 })
      .lean();

    res.json({ success: true, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = { invoiceType: 'SALES' };
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate as string);
    }

    const [summary] = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          avgSaleValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const statusBreakdown = await Invoice.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        summary: summary || { totalSales: 0, totalRevenue: 0, totalPaid: 0, totalPending: 0, avgSaleValue: 0 },
        statusBreakdown
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const topCustomers = await Invoice.aggregate([
      { $match: { invoiceType: 'SALES' } },
      {
        $group: {
          _id: '$customerId',
          totalPurchases: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'contacts',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({ success: true, data: topCustomers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesTrends = async (req: Request, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const groupBy = period === 'daily' 
      ? { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' }, day: { $dayOfMonth: '$invoiceDate' } }
      : { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } };

    const trends = await Invoice.aggregate([
      { $match: { invoiceType: 'SALES' } },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 12 }
    ]);

    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getSalesReport,
  getSalesSummary,
  getTopCustomers,
  getSalesTrends
};
