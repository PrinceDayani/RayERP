import { Request, Response } from 'express';
import SavedFilter from '../models/SavedFilter';

export const getSavedFilters = async (req: Request, res: Response) => {
  try {
    const { module } = req.query;
    const userId = (req as any).user._id;
    const filters = await SavedFilter.find({ userId, module }).sort({ createdAt: -1 });
    res.json({ success: true, data: filters });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSavedFilter = async (req: Request, res: Response) => {
  try {
    const { name, module, filters, isDefault } = req.body;
    const userId = (req as any).user._id;
    
    if (isDefault) {
      await SavedFilter.updateMany({ userId, module }, { isDefault: false });
    }
    
    const savedFilter = await SavedFilter.create({ userId, name, module, filters, isDefault });
    res.status(201).json({ success: true, data: savedFilter });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSavedFilter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, filters, isDefault } = req.body;
    const userId = (req as any).user._id;
    
    const filter = await SavedFilter.findOne({ _id: id, userId });
    if (!filter) {
      return res.status(404).json({ success: false, message: 'Filter not found' });
    }
    
    if (isDefault) {
      await SavedFilter.updateMany({ userId, module: filter.module }, { isDefault: false });
    }
    
    filter.name = name || filter.name;
    filter.filters = filters || filter.filters;
    filter.isDefault = isDefault !== undefined ? isDefault : filter.isDefault;
    await filter.save();
    
    res.json({ success: true, data: filter });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSavedFilter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    await SavedFilter.findOneAndDelete({ _id: id, userId });
    res.json({ success: true, message: 'Filter deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
