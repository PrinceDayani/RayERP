// backend/src/controllers/dataImportController.ts
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { parseErpWorkbook, importErpData } from '../services/erpWorkbookImportService';

// POST /api/data-import/erp-workbook  (multipart, field "file")
// Query/body param dryRun=true previews counts and owner matching without writing.
export const importErpWorkbook = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as { buffer: Buffer; originalname: string } | undefined;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Attach an .xlsx file in the "file" field.' });
    }

    const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === 'true' || req.body?.dryRun === true;

    // Optional owner-label -> user-email mapping, sent as a JSON string field
    // alongside the file (multipart bodies carry strings).
    let ownerMap: Record<string, string> | undefined;
    if (req.body?.ownerMap) {
      try {
        const parsed = typeof req.body.ownerMap === 'string' ? JSON.parse(req.body.ownerMap) : req.body.ownerMap;
        if (
          typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) ||
          Object.values(parsed).some(v => typeof v !== 'string')
        ) {
          return res.status(400).json({ success: false, message: 'ownerMap must be a JSON object of label -> email strings.' });
        }
        ownerMap = parsed;
      } catch {
        return res.status(400).json({ success: false, message: 'ownerMap is not valid JSON.' });
      }
    }

    const data = await parseErpWorkbook(file.buffer);
    const totalRows = data.roadmapTasks.length + data.dailyTasks.length + data.announcements.length;
    if (totalRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No importable rows found. Expected sheets: "Strategic Roadmap", "Daily Tasks", "Announcements" (Ray Infrastructures ERP workbook format).',
      });
    }

    const report = await importErpData(data, (req as any).user._id, { dryRun, ownerMap });

    logger.info('ERP workbook import completed', {
      user: (req as any).user._id.toString(),
      file: file.originalname,
      dryRun,
      roadmapCreated: report.roadmapTasks.created,
      dailyCreated: report.dailyTasks.created,
      announcementsCreated: report.announcements.created,
    });

    res.json({
      success: true,
      data: report,
      message: dryRun ? 'Dry run complete — nothing was written.' : 'Import complete.',
    });
  } catch (error: any) {
    logger.error('ERP workbook import failed', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
