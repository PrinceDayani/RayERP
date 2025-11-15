import express from 'express';
import InvoiceTemplate from '../models/InvoiceTemplate';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const templates = await InvoiceTemplate.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.body.isDefault) {
      await InvoiceTemplate.updateMany({}, { isDefault: false });
    }
    const template = new InvoiceTemplate({ ...req.body, createdBy: req.user?.id });
    await template.save();
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await InvoiceTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.body.isDefault) {
      await InvoiceTemplate.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    }
    const template = await InvoiceTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await InvoiceTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
