import { Request, Response } from 'express';
import { Invoice as InvoiceModel } from '../models/Finance';

export const getInvoiceAnalytics = async (req: Request, res: Response) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [metrics, revenueData, statusBreakdown, paymentMethods] = await Promise.all([
      InvoiceModel.aggregate([
        {
          $facet: {
            total: [
              { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ],
            overdue: [
              { $match: { status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] }, dueDate: { $lt: new Date() } } },
              { $group: { _id: null, amount: { $sum: '$balanceAmount' }, count: { $sum: 1 } } }
            ],
            avgPaymentTime: [
              { $match: { status: 'PAID', paidAmount: { $gt: 0 } } },
              { $project: { days: { $divide: [{ $subtract: ['$updatedAt', '$invoiceDate'] }, 86400000] } } },
              { $group: { _id: null, avg: { $avg: '$days' } } }
            ]
          }
        }
      ]),
      InvoiceModel.aggregate([
        { $match: { invoiceDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } },
            revenue: { $sum: '$totalAmount' },
            payments: { $sum: '$paidAmount' }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', revenue: 1, payments: 1, _id: 0 } }
      ]),
      InvoiceModel.aggregate([
        {
          $group: {
            _id: '$status',
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            name: '$_id',
            value: 1,
            color: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 'PAID'] }, then: '#10b981' },
                  { case: { $eq: ['$_id', 'SENT'] }, then: '#3b82f6' },
                  { case: { $eq: ['$_id', 'PARTIALLY_PAID'] }, then: '#f59e0b' },
                  { case: { $eq: ['$_id', 'OVERDUE'] }, then: '#ef4444' }
                ],
                default: '#8b5cf6'
              }
            },
            _id: 0
          }
        }
      ]),
      InvoiceModel.aggregate([
        { $match: { status: 'PAID' } },
        { $unwind: { path: '$payments', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$payments.method',
            value: { $sum: '$paidAmount' }
          }
        },
        { $project: { name: { $ifNull: ['$_id', 'Other'] }, value: 1, _id: 0 } }
      ])
    ]);

    const result = metrics[0];
    res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue: result.total[0]?.revenue || 0,
          totalInvoices: result.total[0]?.count || 0,
          totalPayments: result.total[0]?.count || 0,
          overdueAmount: result.overdue[0]?.amount || 0,
          overdueCount: result.overdue[0]?.count || 0,
          avgPaymentTime: Math.round(result.avgPaymentTime[0]?.avg || 0)
        },
        revenueData,
        statusBreakdown,
        paymentMethods
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
