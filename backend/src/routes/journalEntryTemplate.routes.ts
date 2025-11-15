import express from 'express';
import JournalEntryTemplate from '../models/JournalEntryTemplate';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    const templates = await JournalEntryTemplate.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const template = new JournalEntryTemplate({ ...req.body, createdBy: req.user?.id });
    await template.save();
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await JournalEntryTemplate.findById(req.params.id).populate('lines.account lines.costCenter');
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const template = await JournalEntryTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await JournalEntryTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
