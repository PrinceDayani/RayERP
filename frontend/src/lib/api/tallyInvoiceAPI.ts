import { api } from './api';

export interface TallyInvoiceData {
  partyName: string;
  partyEmail?: string;
  partyAddress?: string;
  partyGSTIN?: string;
  workOrderNumber?: string;
  gstEnabled: boolean;
  gstRate?: number;
  invoiceDate: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  notes?: string;
}

export interface TallyInvoice {
  _id: string;
  invoiceNumber: string;
  workOrderNumber?: string;
  partyName: string;
  partyEmail?: string;
  partyAddress?: string;
  partyGSTIN?: string;
  totalAmount: number;
  subtotal: number;
  gstEnabled: boolean;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstTotalAmount?: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    amount: number;
    taxAmount?: number;
    taxRate?: number;
  }>;
  notes?: string;
  currency?: string;
  exchangeRate?: number;
  paymentTerms?: string;
  paidAmount?: number;
  balanceAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const tallyInvoiceAPI = {
  // Create new Tally invoice
  create: async (data: TallyInvoiceData): Promise<{ success: boolean; data?: TallyInvoice; message?: string }> => {
    try {
      const response = await api.post('/tally-invoices', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create Tally invoice'
      };
    }
  },

  // Get all Tally invoices
  getAll: async (): Promise<{ success: boolean; data?: TallyInvoice[]; message?: string }> => {
    try {
      const response = await api.get('/tally-invoices');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch Tally invoices'
      };
    }
  },

  // Get Tally invoice by ID
  getById: async (id: string): Promise<{ success: boolean; data?: TallyInvoice; message?: string }> => {
    try {
      const response = await api.get(`/tally-invoices/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch Tally invoice'
      };
    }
  },

  // Download Tally invoice PDF
  downloadPDF: async (id: string, invoiceNumber: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.get(`/tally-invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tally-invoice-${invoiceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true, message: 'Invoice downloaded successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download invoice'
      };
    }
  },

  // Get invoice statistics
  getStats: async (): Promise<{
    success: boolean;
    data?: {
      totalInvoices: number;
      gstInvoices: number;
      totalAmount: number;
      gstAmount: number;
      paidAmount: number;
      pendingAmount: number;
    };
    message?: string;
  }> => {
    try {
      const response = await api.get('/tally-invoices');
      if (response.data.success && response.data.data) {
        const invoices: TallyInvoice[] = response.data.data;
        
        const stats = {
          totalInvoices: invoices.length,
          gstInvoices: invoices.filter(inv => inv.gstEnabled).length,
          totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
          gstAmount: invoices.reduce((sum, inv) => sum + (inv.gstTotalAmount || 0), 0),
          paidAmount: invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
          pendingAmount: invoices.reduce((sum, inv) => sum + (inv.balanceAmount || inv.totalAmount), 0)
        };
        
        return { success: true, data: stats };
      }
      
      return { success: false, message: 'Failed to calculate statistics' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics'
      };
    }
  },

  // Validate GST number
  validateGSTIN: (gstin: string): boolean => {
    if (!gstin) return true; // Optional field
    
    // Basic GSTIN validation pattern
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinPattern.test(gstin);
  },

  // Calculate GST amounts
  calculateGST: (subtotal: number, gstRate: number, isInterState: boolean = false) => {
    const gstAmount = (subtotal * gstRate) / 100;
    
    if (isInterState) {
      return {
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: gstAmount,
        totalGST: gstAmount
      };
    } else {
      return {
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        igstAmount: 0,
        totalGST: gstAmount
      };
    }
  },

  // Format currency for display
  formatCurrency: (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  // Format date for display
  formatDate: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-IN');
  },

  // Generate invoice preview data
  generatePreview: (data: TallyInvoiceData) => {
    let subtotal = 0;
    
    const processedLineItems = data.lineItems.map(item => {
      const amount = (item.quantity * item.unitPrice) - (item.discount || 0);
      subtotal += amount;
      
      let taxAmount = 0;
      if (data.gstEnabled && data.gstRate) {
        taxAmount = (amount * data.gstRate) / 100;
      }
      
      return {
        ...item,
        amount,
        taxAmount,
        taxRate: data.gstEnabled ? data.gstRate : 0
      };
    });

    const gstCalculation = data.gstEnabled && data.gstRate 
      ? tallyInvoiceAPI.calculateGST(subtotal, data.gstRate, false) // Assuming intra-state for preview
      : { cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalGST: 0 };

    const totalAmount = subtotal + gstCalculation.totalGST;

    return {
      lineItems: processedLineItems,
      subtotal,
      gstCalculation,
      totalAmount
    };
  }
};

export default tallyInvoiceAPI;