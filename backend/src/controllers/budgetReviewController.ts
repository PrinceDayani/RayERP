import { Request, Response } from 'express';
import Budget from '../models/Budget';

export const sendToReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (budget.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft budgets can be sent to review' 
      });
    }

    budget.status = 'pending';
    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget sent to review successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const returnToReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (!['pending', 'rejected'].includes(budget.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending or rejected budgets can be returned to review' 
      });
    }

    budget.status = 'pending';
    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget returned to review'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { sendToReview, returnToReview };
