//path: backend/src/controllers/taskSearchController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import mongoose from 'mongoose';

const SavedSearch = mongoose.model('SavedSearch', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  filters: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
}));

export const advancedSearch = async (req: Request, res: Response) => {
  try {
    const {
      query,
      assignee,
      project,
      status,
      priority,
      tags,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = { isTemplate: false };

    // Full-text search
    if (query) {
      filter.$text = { $search: query as string };
    }

    // Filters
    if (assignee) filter.assignedTo = assignee;
    if (project) filter.project = project;
    if (status) filter.status = Array.isArray(status) ? { $in: status } : status;
    if (priority) filter.priority = Array.isArray(priority) ? { $in: priority } : priority;
    if (tags) filter['tags.name'] = Array.isArray(tags) ? { $in: tags } : tags;

    // Date range
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate as string);
      if (endDate) filter.dueDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('project', 'name')
        .populate('assignedTo', 'firstName lastName')
        .populate('assignedBy', 'firstName lastName')
        .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter)
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const saveSearch = async (req: Request, res: Response) => {
  try {
    const { name, filters } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'Authentication required' });
    if (!name || !filters) return res.status(400).json({ message: 'Name and filters required' });

    const savedSearch = await SavedSearch.create({
      user: user._id,
      name,
      filters
    });

    res.status(201).json({ success: true, savedSearch });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ message: 'Error saving search', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getSavedSearches = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Authentication required' });

    const searches = await SavedSearch.find({ user: user._id }).sort({ createdAt: -1 });
    res.json({ searches });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ message: 'Error fetching saved searches', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteSavedSearch = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Authentication required' });

    const search = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      user: user._id
    });

    if (!search) return res.status(404).json({ message: 'Saved search not found' });

    res.json({ success: true, message: 'Search deleted' });
  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({ message: 'Error deleting search', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { field, query } = req.query;

    if (!field || !query) {
      return res.status(400).json({ message: 'Field and query required' });
    }

    let suggestions: any[] = [];

    switch (field) {
      case 'tags':
        suggestions = await Task.distinct('tags.name', {
          'tags.name': { $regex: query as string, $options: 'i' }
        });
        break;
      case 'assignee':
        const Employee = mongoose.model('Employee');
        const employees = await Employee.find({
          $or: [
            { firstName: { $regex: query as string, $options: 'i' } },
            { lastName: { $regex: query as string, $options: 'i' } }
          ]
        }).limit(10).select('firstName lastName');
        suggestions = employees.map(e => ({ id: e._id, name: `${e.firstName} ${e.lastName}` }));
        break;
      case 'project':
        const Project = mongoose.model('Project');
        const projects = await Project.find({
          name: { $regex: query as string, $options: 'i' }
        }).limit(10).select('name');
        suggestions = projects.map(p => ({ id: p._id, name: p.name }));
        break;
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Error fetching suggestions', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
