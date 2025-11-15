import express from 'express';
import AllocationRule from '../models/AllocationRule';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const rules = await AllocationRule.find().sort({ createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const rule = new AllocationRule({ ...req.body, createdBy: req.user?.id });
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const rule = await AllocationRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await AllocationRule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
