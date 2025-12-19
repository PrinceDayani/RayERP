import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface ReportHeader {
    companyName: string;
    reportTitle: string;
    dateRange?: string;
    generatedDate: string;
}

interface TableColumn {
    header: string;
    field: string;
    width?: number;
    align?: 'left' | 'right' | 'center';
}

/**
 * Generate PDF report using PDFKit
 */
export class PDFReportGenerator {
    private doc: PDFKit.PDFDocument;

    constructor() {
        this.doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });
    }

    /**
     * Add report header
     */
    addHeader(header: ReportHeader): this {
        this.doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text(header.companyName, { align: 'center' })
            .fontSize(16)
            .text(header.reportTitle, { align: 'center' })
            .fontSize(10)
            .font('Helvetica');

        if (header.dateRange) {
            this.doc.text(header.dateRange, { align: 'center' });
        }

        this.doc
            .text(`Generated: ${header.generatedDate}`, { align: 'center' })
            .moveDown(2);

        return this;
    }

    /**
     * Add a table to the PDF
     */
    addTable(columns: TableColumn[], data: any[]): this {
        const startX = 50;
        let currentY = this.doc.y;
        const pageWidth = this.doc.page.width - 100;

        // Calculate column widths if not specified
        const totalWidth = pageWidth;
        const defaultWidth = totalWidth / columns.length;

        columns.forEach(col => {
            if (!col.width) col.width = defaultWidth;
        });

        // Draw header
        this.doc
            .fontSize(10)
            .font('Helvetica-Bold');

        let x = startX;
        columns.forEach(col => {
            this.doc.text(col.header, x, currentY, {
                width: col.width,
                align: col.align || 'left'
            });
            x += col.width!;
        });

        currentY += 20;
        this.doc.moveTo(startX, currentY).lineTo(startX + totalWidth, currentY).stroke();
        currentY += 5;

        // Draw rows
        this.doc.font('Helvetica').fontSize(9);

        data.forEach((row, index) => {
            // Check if we need a new page
            if (currentY > this.doc.page.height - 100) {
                this.doc.addPage();
                currentY = 50;
            }

            x = startX;
            columns.forEach(col => {
                const value = row[col.field]?.toString() || '';
                this.doc.text(value, x, currentY, {
                    width: col.width,
                    align: col.align || 'left'
                });
                x += col.width!;
            });

            currentY += 15;

            // Add subtle line between rows
            if (index < data.length - 1) {
                this.doc
                    .strokeColor('#cccccc')
                    .moveTo(startX, currentY)
                    .lineTo(startX + totalWidth, currentY)
                    .stroke()
                    .strokeColor('#000000');
                currentY += 5;
            }
        });

        this.doc.moveDown(2);
        return this;
    }

    /**
     * Add footer with page numbers
     */
    addFooter(): this {
        const pages = this.doc.bufferedPageRange();

        for (let i = 0; i < pages.count; i++) {
            this.doc.switchToPage(i);

            this.doc
                .fontSize(8)
                .text(
                    `Page ${i + 1} of ${pages.count}`,
                    50,
                    this.doc.page.height - 50,
                    { align: 'center' }
                );
        }

        return this;
    }

    /**
     * Send PDF to response stream
     */
    async sendToResponse(res: Response, filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            this.doc.pipe(res);

            this.doc.on('end', () => resolve());
            this.doc.on('error', (err) => reject(err));

            this.addFooter();
            this.doc.end();
        });
    }

    /**
     * Get PDF as buffer
     */
    async getBuffer(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const buffers: Buffer[] = [];

            this.doc.on('data', (chunk) => buffers.push(chunk));
            this.doc.on('end', () => resolve(Buffer.concat(buffers)));
            this.doc.on('error', (err) => reject(err));

            this.addFooter();
            this.doc.end();
        });
    }
}

/**
 * Generate Trial Balance PDF
 */
export async function generateTrialBalancePDF(
    data: any[],
    dateRange: string
): Promise<PDFReportGenerator> {
    const pdf = new PDFReportGenerator();

    pdf.addHeader({
        companyName: 'RayERP',
        reportTitle: 'Trial Balance',
        dateRange,
        generatedDate: new Date().toLocaleString('en-IN')
    });

    pdf.addTable(
        [
            { header: 'Account Code', field: 'code', width: 100, align: 'left' },
            { header: 'Account Name', field: 'name', width: 200, align: 'left' },
            { header: 'Debit', field: 'debit', width: 100, align: 'right' },
            { header: 'Credit', field: 'credit', width: 100, align: 'right' }
        ],
        data
    );

    return pdf;
}
