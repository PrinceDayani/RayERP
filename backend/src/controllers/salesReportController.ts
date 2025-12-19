import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { validationResult } from 'express-validator';

interface InvoiceFilter {
  invoiceType: string;
  status?: string;
  customerId?: string;
  invoiceDate?: {
    $gte?: Date;
    $lte?: Date;
  };
}

const validateDate = (dateStr: string, fieldName: string): Date | null => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), code: 'VALIDATION_ERROR' });
    }

    const { status, startDate, endDate, customerId, page = 1, limit = 100 } = req.query;

    const filter: InvoiceFilter = { invoiceType: 'SALES' };
    if (status && status !== 'all') filter.status = status.toString().toUpperCase();
    if (customerId) filter.customerId = customerId as string;
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) {
        const start = validateDate(startDate as string, 'startDate');
        if (!start) {
          return res.status(400).json({ success: false, message: 'Invalid start date', code: 'INVALID_DATE' });
        }
        filter.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = validateDate(endDate as string, 'endDate');
        if (!end) {
          return res.status(400).json({ success: false, message: 'Invalid end date', code: 'INVALID_DATE' });
        }
        filter.invoiceDate.$lte = end;
      }
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(500, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [sales, total, summary] = await Promise.all([
      Invoice.find(filter)
        .select('invoiceNumber partyName totalAmount paidAmount balanceAmount status invoiceDate dueDate')
        .populate('customerId', 'name email')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Invoice.countDocuments(filter),
      Invoice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalPaid: { $sum: '$paidAmount' },
            totalPending: { $sum: '$balanceAmount' },
            transactionCount: { $sum: 1 },
            avgSaleValue: { $avg: '$totalAmount' }
          }
        }
      ])
    ]);

    const summaryData = summary[0] || {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      transactionCount: 0,
      avgSaleValue: 0
    };

    res.json({ 
      success: true, 
      data: sales,
      summary: summaryData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sales report:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch sales report', code: 'SERVER_ERROR' });
  }
};

export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: InvoiceFilter = { invoiceType: 'SALES' };
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) {
        const start = validateDate(startDate as string, 'startDate');
        if (!start) {
          return res.status(400).json({ success: false, message: 'Invalid start date', code: 'INVALID_DATE' });
        }
        filter.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = validateDate(endDate as string, 'endDate');
        if (!end) {
          return res.status(400).json({ success: false, message: 'Invalid end date', code: 'INVALID_DATE' });
        }
        filter.invoiceDate.$lte = end;
      }
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
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        summary: summary || { totalSales: 0, totalRevenue: 0, totalPaid: 0, totalPending: 0, avgSaleValue: 0 },
        statusBreakdown
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sales summary:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch sales summary', code: 'SERVER_ERROR' });
  }
};

export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));

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
      { $limit: limitNum },
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
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching top customers:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch top customers', code: 'SERVER_ERROR' });
  }
};

export const getSalesTrends = async (req: Request, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;
    
    if (period !== 'daily' && period !== 'monthly') {
      return res.status(400).json({ success: false, message: 'Invalid period. Use daily or monthly', code: 'INVALID_PERIOD' });
    }

    const groupBy = period === 'daily' 
      ? { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' }, day: { $dayOfMonth: '$invoiceDate' } }
      : { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } };

    const trends = await Invoice.aggregate([
      { $match: { invoiceType: 'SALES' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 12 },
      {
        $project: {
          month: {
            $concat: [
              { $arrayElemAt: [['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], '$_id.month'] },
              ' ',
              { $substr: [{ $toString: '$_id.year' }, 2, 2] }
            ]
          },
          revenue: 1,
          count: 1
        }
      }
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sales trends:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch sales trends', code: 'SERVER_ERROR' });
  }
};

// New endpoint for monthly trend data specifically for frontend
export const getMonthlyTrends = async (req: Request, res: Response) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Invoice.aggregate([
      { 
        $match: { 
          invoiceType: 'SALES',
          invoiceDate: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $arrayElemAt: [
              ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 
              { $subtract: ['$_id.month', 1] }
            ]
          },
          revenue: 1,
          count: 1
        }
      }
    ]);

    // Fill missing months with zero values
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const existingData = trends.find(t => 
        t.month === monthName && 
        t._id?.year === date.getFullYear()
      );
      
      monthlyData.push({
        month: monthName,
        revenue: existingData?.revenue || 0,
        count: existingData?.count || 0
      });
    }

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching monthly trends:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch monthly trends', code: 'SERVER_ERROR' });
  }
};

export default {
  getSalesReport,
  getSalesSummary,
  getTopCustomers,
  getSalesTrends,
  getMonthlyTrends
};
