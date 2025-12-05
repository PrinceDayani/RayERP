import { Request, Response } from 'express';
import BudgetReport from '../models/BudgetReport';
import Budget from '../models/Budget';
import BudgetVariance from '../models/BudgetVariance';
import { generateCSV, generateExcelData, generateJSON, generatePDFData, generateVarianceReportData, generateComparisonReportData } from '../utils/reportGenerator';
import fs from 'fs';
import path from 'path';

// Generate report
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { reportName, reportType, budgetIds, filters, format } = req.body;
    const userId = req.user?.userId;

    // Create report record
    const report = await BudgetReport.create({
      reportName,
      reportType,
      budgets: budgetIds || [],
      filters: filters || {},
      format,
      generatedBy: userId,
      status: 'generating',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Fetch budgets based on filters
    const query: any = {};
    if (budgetIds && budgetIds.length > 0) {
      query._id = { $in: budgetIds };
    }
    if (filters?.fiscalYear) query.fiscalYear = filters.fiscalYear;
    if (filters?.departmentId) query.departmentId = filters.departmentId;
    if (filters?.projectId) query.projectId = filters.projectId;
    if (filters?.status) query.status = { $in: filters.status };
    if (filters?.dateRange) {
      query.createdAt = {
        $gte: new Date(filters.dateRange.startDate),
        $lte: new Date(filters.dateRange.endDate)
      };
    }

    const budgets = await Budget.find(query)
      .populate('departmentId', 'name')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (budgets.length === 0) {
      report.status = 'failed';
      report.errorMessage = 'No budgets found matching criteria';
      await report.save();
      return res.status(404).json({ message: 'No budgets found matching criteria' });
    }

    // Generate report based on format
    let fileContent: any;
    let fileName: string;
    let mimeType: string;

    const reportData = { budgets, reportType, filters };

    switch (format) {
      case 'csv':
        fileContent = generateCSV(reportData);
        fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'excel':
        fileContent = JSON.stringify(generateExcelData(reportData));
        fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'json':
        fileContent = JSON.stringify(generateJSON(reportData), null, 2);
        fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'pdf':
        fileContent = JSON.stringify(generatePDFData(reportData));
        fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      default:
        fileContent = JSON.stringify(generateJSON(reportData), null, 2);
        fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.json`;
        mimeType = 'application/json';
    }

    // Save file (in production, use cloud storage)
    const uploadsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, fileContent);

    // Update report record
    report.fileUrl = `/uploads/reports/${fileName}`;
    report.fileSize = Buffer.byteLength(fileContent);
    report.status = 'completed';
    await report.save();

    const populatedReport = await BudgetReport.findById(report._id)
      .populate('budgets', 'budgetName fiscalYear')
      .populate('generatedBy', 'name email');

    res.status(201).json({
      message: 'Report generated successfully',
      report: populatedReport
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

// Get all reports
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { status, reportType } = req.query;
    const userId = req.user?.userId;

    const filter: any = { generatedBy: userId };
    if (status) filter.status = status;
    if (reportType) filter.reportType = reportType;

    const reports = await BudgetReport.find(filter)
      .populate('budgets', 'budgetName fiscalYear')
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ reports, count: reports.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

// Get report by ID
export const getReportById = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await BudgetReport.findById(reportId)
      .populate('budgets', 'budgetName fiscalYear totalAmount')
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

// Download report
export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await BudgetReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({ message: 'Report is not ready for download' });
    }

    if (!report.fileUrl) {
      return res.status(404).json({ message: 'Report file not found' });
    }

    const filePath = path.join(__dirname, '../..', report.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Report file not found on server' });
    }

    res.download(filePath);
  } catch (error: any) {
    res.status(500).json({ message: 'Error downloading report', error: error.message });
  }
};

// Delete report
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.userId;

    const report = await BudgetReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.generatedBy.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    // Delete file
    if (report.fileUrl) {
      const filePath = path.join(__dirname, '../..', report.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await BudgetReport.findByIdAndDelete(reportId);

    res.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
};

// Generate variance report
export const generateVarianceReport = async (req: Request, res: Response) => {
  try {
    const { budgetIds, fiscalYear } = req.body;
    const userId = req.user?.userId;

    const budgets = await Budget.find({
      _id: { $in: budgetIds },
      fiscalYear
    }).populate('departmentId', 'name');

    const variances = await BudgetVariance.find({
      budget: { $in: budgetIds }
    }).sort({ createdAt: -1 });

    const reportData = generateVarianceReportData(budgets, variances);

    res.json({
      message: 'Variance report generated',
      data: reportData
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating variance report', error: error.message });
  }
};

// Generate comparison report
export const generateComparisonReport = async (req: Request, res: Response) => {
  try {
    const { fiscalYears, departmentId } = req.body;

    const query: any = { fiscalYear: { $in: fiscalYears } };
    if (departmentId) query.departmentId = departmentId;

    const budgets = await Budget.find(query)
      .populate('departmentId', 'name')
      .populate('projectId', 'name');

    const reportData = generateComparisonReportData(budgets);

    res.json({
      message: 'Comparison report generated',
      data: reportData
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating comparison report', error: error.message });
  }
};

// Get report statistics
export const getReportStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const stats = await BudgetReport.aggregate([
      { $match: { generatedBy: userId } },
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      }
    ]);

    const totalReports = await BudgetReport.countDocuments({ generatedBy: userId });
    const completedReports = await BudgetReport.countDocuments({ generatedBy: userId, status: 'completed' });

    res.json({
      totalReports,
      completedReports,
      byType: stats
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};
