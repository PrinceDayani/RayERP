// backend/src/controllers/contactController.ts
import { Request, Response } from 'express';
import Contact, { IContact } from '../models/Contact';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { createCustomerLedgerAccount } from '../utils/customerLedger';
import Notification from '../models/Notification';

// Rate limiting for contact operations
export const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many contact requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
export const validateContactCreation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('phone').trim().isLength({ min: 1, max: 20 }).withMessage('Phone is required and must be 1-20 characters'),
  body('visibilityLevel').isIn(['universal', 'departmental', 'personal']).withMessage('Invalid visibility level'),
  body('contactType').optional().isIn(['company', 'personal', 'vendor', 'client', 'partner']).withMessage('Invalid contact type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
];

export const validateContactUpdate = [
  param('id').isMongoId().withMessage('Invalid contact ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('phone').optional().trim().isLength({ min: 1, max: 20 }).withMessage('Phone must be 1-20 characters'),
  body('visibilityLevel').optional().isIn(['universal', 'departmental', 'personal']).withMessage('Invalid visibility level'),
];

export const validateContactId = [
  param('id').isMongoId().withMessage('Invalid contact ID')
];

// Utility functions
const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
};

const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors in contact operation', { errors: errors.array(), userId: req.user?.id });
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  return null;
};

const sanitizeContactData = (data: any) => {
  const sanitized: any = {};
  const allowedFields = [
    'name', 'email', 'phone', 'company', 'position', 'address', 'notes', 'tags', 'reference', 
    'alternativePhone', 'visibilityLevel', 'department', 'contactType', 'role', 'priority', 
    'status', 'website', 'linkedIn', 'twitter', 'birthday', 'anniversary', 'industry', 
    'companySize', 'annualRevenue', 'isCustomer', 'isVendor'
  ];
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string') {
        sanitized[field] = data[field].trim();
      } else {
        sanitized[field] = data[field];
      }
    }
  });
  
  return sanitized;
};

// Get all contacts for the logged-in user with visibility filtering
export const getContacts = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    userId = getUserId(req);
    const { status, page = '1', limit = '50', search } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;
    
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const [user, employee] = await Promise.all([
      User.findById(userId).populate('role').lean(),
      Employee.findOne({ user: userId }).lean()
    ]);
    
    if (!user) {
      logger.warn('User not found during contact fetch', { userId });
      return res.status(404).json({ success: false, message: 'User not found' });
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
    
    // Add search functionality
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { company: searchRegex }
        ]
      });
    }
    
    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate('department', 'name')
        .populate('createdBy', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      Contact.countDocuments(filter)
    ]);
    
    const duration = Date.now() - startTime;
    logger.info('Contacts fetched successfully', { 
      userId, 
      count: contacts.length, 
      total, 
      duration,
      page: pageNum,
      limit: limitNum
    });
      
    return res.status(200).json({ 
      success: true, 
      data: contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching contacts', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      duration
    });
    return res.status(500).json({ success: false, message: 'Error fetching contacts' });
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

    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    logger.error('Error fetching contact by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id || 'unknown'
    });
    return res.status(500).json({ success: false, message: 'Error fetching contact' });
  }
};

// Create a new contact
export const createContact = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    // Handle validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;
    
    userId = getUserId(req);
    const sanitizedData = sanitizeContactData(req.body);
    const { 
      name, email, phone, company, position, address, notes, tags, reference, alternativePhone,
      visibilityLevel, department, contactType, role, priority, status, website, linkedIn, twitter, 
      birthday, anniversary, industry, companySize, annualRevenue, isCustomer, isVendor
    } = sanitizedData;

    // Additional business logic validation
    if (visibilityLevel === 'departmental') {
      if (!department) {
        return res.status(400).json({ success: false, message: 'Department is required for departmental contacts' });
      }
      
      // Verify department exists
      const Department = require('../models/Department').default;
      const deptExists = await Department.findById(department).lean();
      if (!deptExists) {
        return res.status(400).json({ success: false, message: 'Department not found' });
      }
    }

    // Check for duplicate contacts (same phone or email)
    const duplicateFilter: any = { $or: [{ phone }] };
    if (email) duplicateFilter.$or.push({ email });
    
    const existingContact = await Contact.findOne(duplicateFilter).lean();
    if (existingContact) {
      logger.warn('Attempt to create duplicate contact', { userId, phone, email });
      return res.status(409).json({ 
        success: false, 
        message: 'Contact with this phone or email already exists' 
      });
    }

    const newContact = new Contact({
      name,
      email,
      phone,
      company,
      position,
      address,
      notes,
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      reference,
      alternativePhone,
      visibilityLevel,
      department: visibilityLevel === 'departmental' ? department : undefined,
      contactType: contactType || 'personal',
      role,
      priority: priority || 'medium',
      status: status || 'active',
      website,
      linkedIn,
      twitter,
      birthday,
      anniversary,
      industry,
      companySize,
      annualRevenue,
      isCustomer: Boolean(isCustomer),
      isVendor: Boolean(isVendor),
      createdBy: userId,
    });

    const savedContact = await newContact.save();
    await savedContact.populate(['department', 'createdBy']);
    
    // Auto-create ledger account if marked as customer or vendor
    if (isCustomer || isVendor) {
      try {
        const accountId = await createCustomerLedgerAccount(
          savedContact._id.toString(), 
          savedContact.name, 
          userId, 
          Boolean(isVendor)
        );
        savedContact.ledgerAccountId = accountId;
        await savedContact.save();
        
        const accountType = isVendor ? 'Vendor' : 'Customer';
        logger.info(`${accountType} ledger account auto-created`, { contactId: savedContact._id, accountId });
        
        // Create notification
        const notification = await Notification.create({
          userId,
          type: 'success',
          title: `${accountType} Account Created`,
          message: `${accountType} "${savedContact.name}" has been created with ledger account.`,
          priority: 'medium',
          actionUrl: `/dashboard/contacts/${savedContact._id}`,
          metadata: { contactId: savedContact._id, accountId, accountType }
        });
        
        // Emit real-time notification
        if (global.io) {
          global.io.to(userId).emit('notification:new', notification);
        }
      } catch (ledgerError) {
        logger.warn('Failed to create ledger account', { 
          error: ledgerError instanceof Error ? ledgerError.message : 'Unknown error',
          contactId: savedContact._id,
          isCustomer,
          isVendor
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('Contact created successfully', { 
      userId, 
      contactId: savedContact._id, 
      name: savedContact.name,
      duration
    });
    
    // Emit real-time update
    if (global.io) {
      global.io.emit('contact:created', {
        _id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        isCustomer: savedContact.isCustomer
      });
    }
    
    return res.status(201).json({ success: true, data: savedContact });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating contact', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      duration,
      requestBody: req.body
    });
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        return res.status(409).json({ success: false, message: 'Contact already exists' });
      }
    }
    
    return res.status(500).json({ success: false, message: 'Error creating contact' });
  }
};

// Update an existing contact with enhanced validation
export const updateContact = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;
    
    userId = getUserId(req);
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    if (contact.createdBy.toString() !== userId) {
      logger.warn('Unauthorized contact update attempt', { userId, contactId: id });
      return res.status(403).json({ success: false, message: 'Only the creator can update this contact' });
    }
    
    const sanitizedData = sanitizeContactData(req.body);
    
    // Validate visibility level change
    if (sanitizedData.visibilityLevel === 'departmental') {
      if (!sanitizedData.department) {
        return res.status(400).json({ success: false, message: 'Department is required for departmental contacts' });
      }
      
      const Department = require('../models/Department').default;
      const deptExists = await Department.findById(sanitizedData.department).lean();
      if (!deptExists) {
        return res.status(400).json({ success: false, message: 'Department not found' });
      }
    }
    
    // Update fields with sanitization
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] !== undefined && key !== 'createdBy') {
        (contact as any)[key] = sanitizedData[key];
      }
    });
    
    // Handle department logic
    if (sanitizedData.visibilityLevel !== undefined) {
      contact.visibilityLevel = sanitizedData.visibilityLevel;
      if (sanitizedData.visibilityLevel !== 'departmental') {
        contact.department = undefined;
      }
    }
    if (sanitizedData.department !== undefined && contact.visibilityLevel === 'departmental') {
      contact.department = sanitizedData.department;
    }

    const updatedContact = await contact.save();
    await updatedContact.populate(['department', 'createdBy']);
    
    // Auto-create ledger account if newly marked as customer or vendor
    if ((sanitizedData.isCustomer || sanitizedData.isVendor) && !updatedContact.ledgerAccountId) {
      try {
        const accountId = await createCustomerLedgerAccount(
          updatedContact._id.toString(), 
          updatedContact.name, 
          userId,
          Boolean(sanitizedData.isVendor)
        );
        updatedContact.ledgerAccountId = accountId;
        await updatedContact.save();
        
        const accountType = sanitizedData.isVendor ? 'Vendor' : 'Customer';
        logger.info(`${accountType} ledger account auto-created on update`, { contactId: updatedContact._id, accountId });
        
        // Create notification
        const notification = await Notification.create({
          userId,
          type: 'success',
          title: `${accountType} Account Created`,
          message: `Contact "${updatedContact.name}" has been marked as ${accountType.toLowerCase()} with ledger account.`,
          priority: 'medium',
          actionUrl: `/dashboard/contacts/${updatedContact._id}`,
          metadata: { contactId: updatedContact._id, accountId, accountType }
        });
        
        // Emit real-time notification
        if (global.io) {
          global.io.to(userId).emit('notification:new', notification);
        }
      } catch (ledgerError) {
        logger.warn('Failed to create ledger account on update', { 
          error: ledgerError instanceof Error ? ledgerError.message : 'Unknown error',
          contactId: updatedContact._id,
          isCustomer: sanitizedData.isCustomer,
          isVendor: sanitizedData.isVendor
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('Contact updated successfully', { userId, contactId: updatedContact._id, duration });
    
    // Send update notification
    try {
      const notification = await Notification.create({
        userId,
        type: 'info',
        title: 'Contact Updated',
        message: `Contact "${updatedContact.name}" has been updated successfully.`,
        priority: 'low',
        actionUrl: `/dashboard/contacts/${updatedContact._id}`,
        metadata: { contactId: updatedContact._id }
      });
      
      if (global.io) {
        global.io.to(userId).emit('notification:new', notification);
      }
    } catch (notifError) {
      logger.warn('Failed to send update notification', { error: notifError });
    }
    
    if (global.io) {
      global.io.emit('contact:updated', {
        _id: updatedContact._id,
        name: updatedContact.name,
        email: updatedContact.email,
        isCustomer: updatedContact.isCustomer
      });
    }
    
    return res.status(200).json({ success: true, data: updatedContact });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating contact', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      contactId: req.params.id,
      duration
    });
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(500).json({ success: false, message: 'Error updating contact' });
  }
};

// Delete a contact
export const deleteContact = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;
    
    userId = getUserId(req);
    const { id } = req.params;
    
    const contact = await Contact.findById(id).lean();

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    if (contact.createdBy.toString() !== userId) {
      logger.warn('Unauthorized contact deletion attempt', { userId, contactId: id });
      return res.status(403).json({ success: false, message: 'Only the creator can delete this contact' });
    }
    
    await Contact.findByIdAndDelete(id);
    
    const duration = Date.now() - startTime;
    logger.info('Contact deleted successfully', { userId, contactId: id, duration });

    if (global.io) {
      global.io.emit('contact:deleted', id);
    }

    return res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting contact', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      contactId: req.params.id,
      duration
    });
    return res.status(500).json({ success: false, message: 'Error deleting contact' });
  }
};

// Search contacts
export const searchContacts = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    userId = getUserId(req);
    const { query, limit = '20' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid search query is required' });
    }

    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({ success: false, message: 'Search query cannot be empty' });
    }

    if (sanitizedQuery.length > 100) {
      return res.status(400).json({ success: false, message: 'Search query too long' });
    }
    
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const user = await User.findById(userId).populate('role').lean();
    const employee = await Employee.findOne({ user: userId }).lean();
    const isRoot = user?.role?.name === 'root';
    
    const visibilityFilter: any = {};
    if (!isRoot) {
      visibilityFilter.$or = [
        { visibilityLevel: 'universal' },
        { visibilityLevel: 'personal', createdBy: userId }
      ];
      
      if (employee?.department) {
        visibilityFilter.$or.push({
          visibilityLevel: 'departmental',
          department: employee.department
        });
      }
    }

    const searchRegex = new RegExp(sanitizedQuery, 'i');
    const contacts = await Contact.find({
      ...visibilityFilter,
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { role: searchRegex },
      ],
    })
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .sort({ name: 1 })
    .limit(limitNum)
    .lean();
    
    const duration = Date.now() - startTime;
    logger.info('Contact search completed', { 
      userId, 
      query: sanitizedQuery, 
      results: contacts.length,
      duration
    });

    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error searching contacts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      query: req.query.query,
      duration
    });
    return res.status(500).json({ success: false, message: 'Error searching contacts' });
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

// Get customers only
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = '1', limit = '100' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 100));
    const skip = (pageNum - 1) * limitNum;
    
    const User = require('../models/User').default;
    const Employee = require('../models/Employee').default;
    
    const [user, employee] = await Promise.all([
      User.findById(userId).populate('role').lean(),
      Employee.findOne({ user: userId }).lean()
    ]);
    
    const isRoot = user?.role?.name === 'root';
    
    const filter: any = { isCustomer: true, status: 'active' };
    
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
    
    const [customers, total] = await Promise.all([
      Contact.find(filter)
        .select('name email phone company isCustomer')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(filter)
    ]);
    
    logger.info('Customers fetched', { userId, count: customers.length, total });
    
    return res.status(200).json({ 
      success: true, 
      data: customers,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    logger.error('Error fetching customers', { error: error instanceof Error ? error.message : 'Unknown' });
    return res.status(500).json({ success: false, message: 'Error fetching customers' });
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