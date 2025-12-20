import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export const generateBalanceSheetPDF = async (data: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Balance Sheet', { align: 'center' });
    doc.fontSize(12).text(`As of ${new Date(data.asOfDate).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Assets
    doc.fontSize(16).text('Assets', { underline: true });
    doc.moveDown(0.5);
    
    if (data.assets?.current?.length) {
      doc.fontSize(14).text('Current Assets');
      data.assets.current.forEach((item: any) => {
        doc.fontSize(10).text(`${item.account} (${item.code})`, 70, doc.y, { continued: true });
        doc.text(`₹${item.amount.toLocaleString('en-IN')}`, { align: 'right' });
      });
      doc.fontSize(12).text(`Total Current Assets: ₹${data.assets.totalCurrent.toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown();
    }

    if (data.assets?.nonCurrent) {
      doc.fontSize(14).text('Non-Current Assets');
      if (data.assets.nonCurrent.fixed?.length) {
        doc.fontSize(11).text('Fixed Assets');
        data.assets.nonCurrent.fixed.forEach((item: any) => {
          doc.fontSize(10).text(`${item.account} (${item.code})`, 80, doc.y, { continued: true });
          doc.text(`₹${item.amount.toLocaleString('en-IN')}`, { align: 'right' });
        });
      }
      doc.fontSize(12).text(`Total Non-Current Assets: ₹${data.assets.totalNonCurrent.toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown();
    }

    doc.fontSize(14).fillColor('green').text(`Total Assets: ₹${data.totalAssets.toLocaleString('en-IN')}`, { align: 'right' });
    doc.fillColor('black').moveDown(2);

    // Liabilities
    doc.fontSize(16).text('Liabilities', { underline: true });
    doc.moveDown(0.5);
    
    if (data.liabilities?.current?.length) {
      doc.fontSize(14).text('Current Liabilities');
      data.liabilities.current.forEach((item: any) => {
        doc.fontSize(10).text(`${item.account} (${item.code})`, 70, doc.y, { continued: true });
        doc.text(`₹${item.amount.toLocaleString('en-IN')}`, { align: 'right' });
      });
      doc.fontSize(12).text(`Total Current Liabilities: ₹${data.liabilities.totalCurrent.toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown();
    }

    doc.fontSize(14).fillColor('red').text(`Total Liabilities: ₹${data.totalLiabilities.toLocaleString('en-IN')}`, { align: 'right' });
    doc.fillColor('black').moveDown(2);

    // Equity
    doc.fontSize(16).text('Equity', { underline: true });
    doc.moveDown(0.5);
    
    if (data.equity?.shareCapital?.length) {
      data.equity.shareCapital.forEach((item: any) => {
        doc.fontSize(10).text(`${item.account} (${item.code})`, 70, doc.y, { continued: true });
        doc.text(`₹${item.amount.toLocaleString('en-IN')}`, { align: 'right' });
      });
    }

    doc.fontSize(14).fillColor('blue').text(`Total Equity: ₹${data.totalEquity.toLocaleString('en-IN')}`, { align: 'right' });
    doc.fillColor('black').moveDown(2);

    // Ratios
    if (data.ratios) {
      doc.addPage();
      doc.fontSize(16).text('Financial Ratios', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Current Ratio: ${data.ratios.currentRatio.toFixed(2)}`);
      doc.text(`Quick Ratio: ${data.ratios.quickRatio.toFixed(2)}`);
      doc.text(`Debt-to-Equity: ${data.ratios.debtToEquity.toFixed(2)}`);
      doc.text(`Equity Ratio: ${(data.ratios.equityRatio * 100).toFixed(1)}%`);
      doc.text(`Working Capital: ₹${data.ratios.workingCapital.toLocaleString('en-IN')}`);
    }

    // Footer
    doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();
  });
};

export const generateExcelBuffer = (data: any): Buffer => {
  let csv = 'Account,Code,Amount\n';
  csv += 'ASSETS\n';
  csv += 'Current Assets\n';
  data.assets?.current?.forEach((a: any) => {
    csv += `${a.account},${a.code},${a.amount}\n`;
  });
  csv += `Total Current Assets,,${data.assets?.totalCurrent}\n\n`;
  csv += 'Non-Current Assets\n';
  data.assets?.nonCurrent?.fixed?.forEach((a: any) => {
    csv += `${a.account},${a.code},${a.amount}\n`;
  });
  csv += `Total Assets,,${data.totalAssets}\n\n`;
  csv += 'LIABILITIES\n';
  data.liabilities?.current?.forEach((l: any) => {
    csv += `${l.account},${l.code},${l.amount}\n`;
  });
  csv += `Total Liabilities,,${data.totalLiabilities}\n\n`;
  csv += 'EQUITY\n';
  data.equity?.shareCapital?.forEach((e: any) => {
    csv += `${e.account},${e.code},${e.amount}\n`;
  });
  csv += `Total Equity,,${data.totalEquity}\n`;
  return Buffer.from(csv, 'utf-8');
};
