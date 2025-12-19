// Export Utilities for Finance Module
// Provides CSV and PDF export functionality for all transaction pages

export interface ExportColumn {
    header: string;
    accessor: string | ((row: any) => any);
    format?: (value: any) => string;
}

export interface ExportOptions {
    filename: string;
    columns: ExportColumn[];
    data: any[];
    title?: string;
    includeTimestamp?: boolean;
}

// ==================== CSV EXPORT ====================

export const exportToCSV = (options: ExportOptions): void => {
    const { filename, columns, data, includeTimestamp = true } = options;

    // Build CSV header
    const headers = columns.map(col => col.header).join(',');

    // Build CSV rows
    const rows = data.map(row => {
        return columns.map(col => {
            let value;
            if (typeof col.accessor === 'function') {
                value = col.accessor(row);
            } else {
                value = row[col.accessor];
            }

            // Apply formatting if provided
            if (col.format) {
                value = col.format(value);
            }

            // Escape commas and quotes
            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const finalFilename = includeTimestamp
        ? `${filename}_${new Date().toISOString().split('T')[0]}.csv`
        : `${filename}.csv`;

    downloadFile(blob, finalFilename);
};

// ==================== PDF EXPORT ====================

export const exportToPDF = async (options: ExportOptions): Promise<void> => {
    const { filename, columns, data, title, includeTimestamp = true } = options;

    // Generate HTML table
    const tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
      </style>
    </head>
    <body>
      ${title ? `<h1>${title}</h1>` : ''}
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
        let value;
        if (typeof col.accessor === 'function') {
            value = col.accessor(row);
        } else {
            value = row[col.accessor];
        }
        if (col.format) {
            value = col.format(value);
        }
        return `<td>${value || ''}</td>`;
    }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${includeTimestamp ? `<p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>` : ''}
    </body>
    </html>
  `;

    // Use browser print for PDF (simple approach)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(tableHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
};

// ==================== HELPER FUNCTIONS ====================

export const downloadFile = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// ==================== COMMON FORMATTERS ====================

export const formatters = {
    currency: (value: number): string => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: (value: string | Date): string => new Date(value).toLocaleDateString('en-IN'),
    dateTime: (value: string | Date): string => new Date(value).toLocaleString('en-IN'),
    percentage: (value: number): string => `${value.toFixed(2)}%`,
    boolean: (value: boolean): string => value ? 'Yes' : 'No',
    status: (value: string): string => value.charAt(0).toUpperCase() + value.slice(1),
};

// ==================== PRE-CONFIGURED EXPORTS ====================

// Recurring Entries Export
export const exportRecurringEntries = (entries: any[]) => {
    exportToCSV({
        filename: 'recurring_entries',
        columns: [
            { header: 'Name', accessor: 'name' },
            { header: 'Frequency', accessor: 'frequency' },
            { header: 'Start Date', accessor: 'startDate', format: formatters.date },
            { header: 'End Date', accessor: 'endDate', format: formatters.date },
            { header: 'Status', accessor: 'isActive', format: (v) => v ? 'Active' : 'Inactive' },
            { header: 'Next Run', accessor: 'nextRunDate', format: formatters.date },
        ],
        data: entries
    });
};

// Invoices Export
export const exportInvoices = (invoices: any[]) => {
    exportToCSV({
        filename: 'invoices',
        columns: [
            { header: 'Invoice #', accessor: 'invoiceNumber' },
            { header: 'Customer', accessor: 'customerName' },
            { header: 'Issue Date', accessor: 'issueDate', format: formatters.date },
            { header: 'Due Date', accessor: 'dueDate', format: formatters.date },
            { header: 'Amount', accessor: 'totalAmount', format: formatters.currency },
            { header: 'Paid', accessor: 'paidAmount', format: formatters.currency },
            { header: 'Balance', accessor: 'balanceAmount', format: formatters.currency },
            { header: 'Status', accessor: 'status', format: formatters.status },
        ],
        data: invoices
    });
};

// Payments Export
export const exportPayments = (payments: any[]) => {
    exportToCSV({
        filename: 'payments',
        columns: [
            { header: 'Payment #', accessor: 'paymentNumber' },
            { header: 'Customer/Vendor', accessor: 'customerName' },
            { header: 'Date', accessor: 'paymentDate', format: formatters.date },
            { header: 'Method', accessor: 'paymentMethod' },
            { header: 'Amount', accessor: 'totalAmount', format: formatters.currency },
            { header: 'Currency', accessor: 'currency' },
            { header: 'Status', accessor: 'status', format: formatters.status },
        ],
        data: payments
    });
};

// Bills Export
export const exportBills = (bills: any[]) => {
    exportToCSV({
        filename: 'bills',
        columns: [
            { header: 'Bill #', accessor: 'billNumber' },
            { header: 'Vendor', accessor: 'vendor' },
            { header: 'Bill Date', accessor: 'billDate', format: formatters.date },
            { header: 'Due Date', accessor: 'dueDate', format: formatters.date },
            { header: 'Amount', accessor: 'totalAmount', format: formatters.currency },
            { header: 'Paid', accessor: 'paidAmount', format: formatters.currency },
            { header: 'Status', accessor: 'status', format: formatters.status },
        ],
        data: bills
    });
};
