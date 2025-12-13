// backend/src/controllers/contactController.ts
import { Request, Response } from 'express';
import Contact, { IContact } from '../models/Contact';

// Define a type assertion function to safely access req.user
const getUserId = (req: Request): string => {
  // We know req.user exists and has an id because of the protect middleware
  if (!req.user || !req.user.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
};

// Get all contacts for the logged-in user with visibility filtering
export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status } = req.query;
    
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const [user, employee] = await Promise.all([
      User.findById(userId).populate('role').lean(),
      Employee.findOne({ user: userId }).lean()
    ]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isRoot = user.role?.name === 'root';
    
    // Build visibility filter
    const filter: any = {};
    
    if (!isRoot) {
      const orConditions: any[] = [
        { visibilityLevel: 'universal' },
        { visibilityLevel: 'personal', createdBy: userId }
      ];
      
      if (employee?.department) {
        orConditions.push({
          visibilityLevel: 'departmental',
          department: employee.department
        });
      }
      
      filter.$or = orConditions;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const contacts = await Contact.find(filter)
      .populate('department', 'name')
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .lean()
      .exec();
      
    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ message: 'Error fetching contacts' });
  }
};

// Get a single contact by ID with visibility check
export const getContactById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const [user, employee, contact] = await Promise.all([
      User.findById(userId).populate('role').lean(),
      Employee.findOne({ user: userId }).lean(),
      Contact.findById(id)
        .populate('department', 'name')
        .populate('createdBy', 'name email')
        .lean()
    ]);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    const isRoot = user?.role?.name === 'root';
    
    // Check visibility permissions
    const canView = isRoot ||
      contact.visibilityLevel === 'universal' ||
      (contact.visibilityLevel === 'personal' && contact.createdBy._id.toString() === userId) ||
      (contact.visibilityLevel === 'departmental' && 
       employee?.department && 
       contact.department?._id && 
       employee.department.toString() === contact.department._id.toString());
    
    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return res.status(500).json({ message: 'Error fetching contact' });
  }
};

// Create a new contact
export const createContact = async (req: Request, res: Response) => {
  let userId: string;
  try {
    userId = getUserId(req);
    const { 
      name, email, phone, company, position, address, notes, tags, reference, alternativePhone,
      visibilityLevel, department, contactType, role, priority, status, website, linkedIn, twitter, 
      birthday, anniversary, industry, companySize, annualRevenue
    } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ message: 'Phone is required' });
    }
    if (!visibilityLevel) {
      return res.status(400).json({ message: 'Visibility level is required' });
    }
    if (!['universal', 'departmental', 'personal'].includes(visibilityLevel)) {
      return res.status(400).json({ message: 'Invalid visibility level' });
    }
    if (visibilityLevel === 'departmental') {
      if (!department) {
        return res.status(400).json({ message: 'Department is required for departmental contacts' });
      }
      if (!department.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
      
      // Verify department exists
      const Department = require('../models/Department').default;
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    const newContact = new Contact({
      name: name.trim(),
      email: email?.trim(),
      phone: phone.trim(),
      company: company?.trim(),
      position: position?.trim(),
      address: address?.trim(),
      notes: notes?.trim(),
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      reference: reference?.trim(),
      alternativePhone: alternativePhone?.trim(),
      visibilityLevel,
      department: visibilityLevel === 'departmental' ? department : undefined,
      contactType: contactType || 'personal',
      role: role?.trim(),
      priority: priority || 'medium',
      status: status || 'active',
      website: website?.trim(),
      linkedIn: linkedIn?.trim(),
      twitter: twitter?.trim(),
      birthday,
      anniversary,
      industry: industry?.trim(),
      companySize: companySize?.trim(),
      annualRevenue: annualRevenue?.trim(),
      createdBy: userId,
    });

    const savedContact = await newContact.save();
    await savedContact.populate(['department', 'createdBy']);
    
    if (global.io) {
      global.io.emit('contact:created', savedContact.toObject());
    }
    
    return res.status(201).json(savedContact);
  } catch (error) {
    console.error('Error creating contact:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: userId || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Error creating contact' });
  }
};

// Update an existing contact
export const updateContact = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { 
      name, email, phone, company, position, address, notes, tags, reference, alternativePhone,
      visibilityLevel, department, contactType, role, priority, status, website, linkedIn, twitter, 
      birthday, anniversary, industry, companySize, annualRevenue
    } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    if (contact.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only the creator can update this contact' });
    }
    
    // Validate visibility level change
    if (visibilityLevel) {
      if (!['universal', 'departmental', 'personal'].includes(visibilityLevel)) {
        return res.status(400).json({ message: 'Invalid visibility level' });
      }
      if (visibilityLevel === 'departmental') {
        if (!department) {
          return res.status(400).json({ message: 'Department is required for departmental contacts' });
        }
        if (!department.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ message: 'Invalid department ID' });
        }
        
        const Department = require('../models/Department').default;
        const deptExists = await Department.findById(department);
        if (!deptExists) {
          return res.status(400).json({ message: 'Department not found' });
        }
      }
    }

    // Update fields with trimming
    if (name !== undefined) contact.name = name.trim();
    if (email !== undefined) contact.email = email?.trim();
    if (phone !== undefined) contact.phone = phone.trim();
    if (company !== undefined) contact.company = company?.trim();
    if (position !== undefined) contact.position = position?.trim();
    if (address !== undefined) contact.address = address?.trim();
    if (notes !== undefined) contact.notes = notes?.trim();
    if (tags !== undefined) contact.tags = Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [];
    if (reference !== undefined) contact.reference = reference?.trim();
    if (alternativePhone !== undefined) contact.alternativePhone = alternativePhone?.trim();
    if (visibilityLevel !== undefined) {
      contact.visibilityLevel = visibilityLevel;
      // Clear department if not departmental
      if (visibilityLevel !== 'departmental') {
        contact.department = undefined;
      }
    }
    if (department !== undefined && contact.visibilityLevel === 'departmental') {
      contact.department = department;
    }
    if (contactType !== undefined) contact.contactType = contactType;
    if (role !== undefined) contact.role = role?.trim();
    if (priority !== undefined) contact.priority = priority;
    if (status !== undefined) contact.status = status;
    if (website !== undefined) contact.website = website?.trim();
    if (linkedIn !== undefined) contact.linkedIn = linkedIn?.trim();
    if (twitter !== undefined) contact.twitter = twitter?.trim();
    if (birthday !== undefined) contact.birthday = birthday;
    if (anniversary !== undefined) contact.anniversary = anniversary;
    if (industry !== undefined) contact.industry = industry?.trim();
    if (companySize !== undefined) contact.companySize = companySize?.trim();
    if (annualRevenue !== undefined) contact.annualRevenue = annualRevenue?.trim();

    const updatedContact = await contact.save();
    await updatedContact.populate(['department', 'createdBy']);
    
    if (global.io) {
      global.io.emit('contact:updated', updatedContact.toObject());
    }
    
    return res.status(200).json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Error updating contact' });
  }
};

// Delete a contact
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    
    const contact = await Contact.findById(id).lean();

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    if (contact.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only the creator can delete this contact' });
    }
    
    await Contact.findByIdAndDelete(id);

    if (global.io) {
      global.io.emit('contact:deleted', id);
    }

    return res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({ message: 'Error deleting contact' });
  }
};

// Search contacts
export const searchContacts = async (req: Request, res: Response) => {
  let userId: string;
  try {
    userId = getUserId(req);
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Valid search query is required' });
    }

    // Sanitize the search query to prevent NoSQL injection
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({ message: 'Search query cannot be empty' });
    }

    if (sanitizedQuery.length > 100) {
      return res.status(400).json({ message: 'Search query too long' });
    }
    
    // Get user with employee info
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const user = await User.findById(userId).populate('role');
    const employee = await Employee.findOne({ user: userId });
    const isRoot = user?.role?.name === 'root';
    
    // Build visibility filter
    const visibilityFilter: any = {
      $or: [
        { visibilityLevel: 'universal' },
        { visibilityLevel: 'personal', createdBy: userId }
      ]
    };
    
    if (employee?.department) {
      visibilityFilter.$or.push({
        visibilityLevel: 'departmental',
        department: employee.department
      });
    }
    
    if (isRoot) {
      delete visibilityFilter.$or;
    }

    const contacts = await Contact.find({
      ...visibilityFilter,
      $or: [
        { name: { $regex: sanitizedQuery, $options: 'i' } },
        { email: { $regex: sanitizedQuery, $options: 'i' } },
        { phone: { $regex: sanitizedQuery, $options: 'i' } },
        { company: { $regex: sanitizedQuery, $options: 'i' } },
        { role: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    })
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .sort({ name: 1 })
    .limit(50);

    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: userId || 'unknown',
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ message: 'Error searching contacts' });
  }
};

// Advanced filter contacts
export const filterContacts = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { 
      visibilityLevel,
      contactType, 
      company, 
      department, 
      role, 
      priority, 
      status, 
      tags, 
      industry,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    // Get user with employee info
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const user = await User.findById(userId).populate('role');
    const employee = await Employee.findOne({ user: userId });
    const isRoot = user?.role?.name === 'root';
    
    // Build visibility filter
    const filter: any = {};
    
    if (!isRoot) {
      filter.$or = [
        { visibilityLevel: 'universal' },
        { visibilityLevel: 'personal', createdBy: userId }
      ];
      
      if (employee?.department) {
        filter.$or.push({
          visibilityLevel: 'departmental',
          department: employee.department
        });
      }
    }
    
    if (visibilityLevel) filter.visibilityLevel = visibilityLevel;
    if (contactType) filter.contactType = contactType;
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (department) filter.department = department;
    if (role) filter.role = { $regex: role, $options: 'i' };
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate('department', 'name')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .exec(),
      Contact.countDocuments(filter)
    ]);

    return res.status(200).json({
      contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error filtering contacts:', error);
    return res.status(500).json({ message: 'Error filtering contacts' });
  }
};

// Get contact statistics and filter options
export const getContactStats = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    // Get user with employee info
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    const Department = require('../models/Department').default;
    
    const user = await User.findById(userId).populate('role');
    const employee = await Employee.findOne({ user: userId });
    const isRoot = user?.role?.name === 'root';
    
    // Build visibility filter
    const visibilityMatch: any = {};
    
    if (!isRoot) {
      visibilityMatch.$or = [
        { visibilityLevel: 'universal' },
        { visibilityLevel: 'personal', createdBy: userId }
      ];
      
      if (employee?.department) {
        visibilityMatch.$or.push({
          visibilityLevel: 'departmental',
          department: employee.department
        });
      }
    }
    
    const [stats, filterOptions, departments] = await Promise.all([
      // Get statistics
      Contact.aggregate([
        { $match: visibilityMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byType: {
              $push: {
                type: '$contactType',
                priority: '$priority',
                status: '$status',
                visibilityLevel: '$visibilityLevel'
              }
            }
          }
        }
      ]),
      
      // Get unique filter options
      Contact.aggregate([
        { $match: visibilityMatch },
        {
          $group: {
            _id: null,
            companies: { $addToSet: '$company' },
            roles: { $addToSet: '$role' },
            industries: { $addToSet: '$industry' },
            tags: { $addToSet: '$tags' }
          }
        }
      ]),
      
      // Get all departments
      Department.find({}, 'name')
    ]);

    const result = {
      stats: stats[0] || { total: 0, byType: [] },
      filterOptions: {
        companies: filterOptions[0]?.companies?.filter(Boolean) || [],
        departments: departments.map(d => ({ _id: d._id, name: d.name })),
        roles: filterOptions[0]?.roles?.filter(Boolean) || [],
        industries: filterOptions[0]?.industries?.filter(Boolean) || [],
        tags: filterOptions[0]?.tags?.flat().filter(Boolean) || [],
        visibilityLevels: ['universal', 'departmental', 'personal'],
        contactTypes: ['company', 'personal', 'vendor', 'client', 'partner'],
        priorities: ['low', 'medium', 'high', 'critical'],
        statuses: ['active', 'inactive', 'archived']
      }
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting contact stats:', error);
    return res.status(500).json({ message: 'Error getting contact statistics' });
  }
};