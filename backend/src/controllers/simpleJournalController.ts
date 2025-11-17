import { Request, Response } from 'express';
import { JournalEntry } from '../models/JournalEntry';

export const createJournalEntry = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const journalData = { ...req.body, createdBy: req.user.id };
    const journalEntry = new JournalEntry(journalData);
    await journalEntry.save();

    res.status(201).json({
      success: true,
      data: journalEntry,
      message: 'Journal entry created successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      JournalEntry.find().sort({ date: -1 }).skip(skip).limit(Number(limit)),
      JournalEntry.countDocuments()
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJournalEntryById = async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};