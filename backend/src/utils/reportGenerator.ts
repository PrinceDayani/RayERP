interface ReportData {
  budgets: any[];
  reportType: string;
  filters: any;
}

// Generate CSV report
export const generateCSV = (data: ReportData): string => {
  const { budgets } = data;
  
  const headers = ['Budget Name', 'Fiscal Year', 'Total Amount', 'Allocated Amount', 'Status', 'Department'];
  const rows = budgets.map(b => [
    b.budgetName,
    b.fiscalYear,
    b.totalAmount,
    b.allocatedAmount,
    b.status,
    b.departmentId?.name || 'N/A'
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
};

// Generate Excel data structure
export const generateExcelData = (data: ReportData): any => {
  const { budgets, reportType } = data;

  const worksheetData = budgets.map(b => ({
    'Budget Name': b.budgetName,
    'Fiscal Year': b.fiscalYear,
    'Total Amount': b.totalAmount,
    'Allocated Amount': b.allocatedAmount,
    'Available': b.totalAmount - b.allocatedAmount,
    'Utilization %': ((b.allocatedAmount / b.totalAmount) * 100).toFixed(2),
    'Status': b.status,
    'Department': b.departmentId?.name || 'N/A',
    'Created Date': new Date(b.createdAt).toLocaleDateString()
  }));

  return {
    sheetName: reportType === 'summary' ? 'Budget Summary' : 'Budget Details',
    data: worksheetData
  };
};

// Generate JSON report
export const generateJSON = (data: ReportData): any => {
  const { budgets, reportType, filters } = data;

  return {
    reportType,
    generatedAt: new Date().toISOString(),
    filters,
    summary: {
      totalBudgets: budgets.length,
      totalAmount: budgets.reduce((sum, b) => sum + b.totalAmount, 0),
      totalAllocated: budgets.reduce((sum, b) => sum + b.allocatedAmount, 0)
    },
    budgets: budgets.map(b => ({
      id: b._id,
      budgetName: b.budgetName,
      fiscalYear: b.fiscalYear,
      totalAmount: b.totalAmount,
      allocatedAmount: b.allocatedAmount,
      availableAmount: b.totalAmount - b.allocatedAmount,
      utilizationPercent: ((b.allocatedAmount / b.totalAmount) * 100).toFixed(2),
      status: b.status,
      department: b.departmentId?.name,
      project: b.projectId?.name,
      categories: b.categories,
      createdAt: b.createdAt
    }))
  };
};

// Generate PDF data structure (for frontend PDF generation)
export const generatePDFData = (data: ReportData): any => {
  const { budgets, reportType, filters } = data;

  return {
    title: `Budget ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    generatedAt: new Date().toISOString(),
    filters,
    summary: {
      totalBudgets: budgets.length,
      totalAmount: budgets.reduce((sum, b) => sum + b.totalAmount, 0),
      totalAllocated: budgets.reduce((sum, b) => sum + b.allocatedAmount, 0),
      totalAvailable: budgets.reduce((sum, b) => sum + (b.totalAmount - b.allocatedAmount), 0)
    },
    budgets: budgets.map(b => ({
      budgetName: b.budgetName,
      fiscalYear: b.fiscalYear,
      totalAmount: b.totalAmount,
      allocatedAmount: b.allocatedAmount,
      availableAmount: b.totalAmount - b.allocatedAmount,
      utilizationPercent: ((b.allocatedAmount / b.totalAmount) * 100).toFixed(2),
      status: b.status,
      department: b.departmentId?.name || 'N/A',
      categories: b.categories || []
    }))
  };
};

// Generate variance report data
export const generateVarianceReportData = (budgets: any[], variances: any[]): any => {
  return budgets.map(budget => {
    const variance = variances.find(v => v.budget.toString() === budget._id.toString());
    
    return {
      budgetName: budget.budgetName,
      budgeted: budget.totalAmount,
      actual: variance?.totalActual || 0,
      variance: variance?.totalVariance || 0,
      variancePercent: variance?.totalVariancePercent || 0,
      status: variance?.overallStatus || 'N/A'
    };
  });
};

// Generate comparison report data
export const generateComparisonReportData = (budgets: any[]): any => {
  const fiscalYears = [...new Set(budgets.map(b => b.fiscalYear))].sort();
  
  return {
    fiscalYears,
    comparison: budgets.reduce((acc: any, budget) => {
      const key = budget.departmentId?.name || budget.projectId?.name || 'Other';
      if (!acc[key]) {
        acc[key] = {};
      }
      acc[key][budget.fiscalYear] = budget.totalAmount;
      return acc;
    }, {})
  };
};
