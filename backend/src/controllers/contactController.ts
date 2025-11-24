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

// Get all contacts for the logged-in user with optional filtering
export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status = 'active' } = req.query;
    
    const filter: any = { createdBy: userId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const contacts = await Contact.find(filter)
      .sort({ name: 1 })
      .exec();
    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ message: 'Error fetching contacts' });
  }
};

// Get a single contact by ID
export const getContactById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
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
      contactType, department, role, priority, status, website, linkedIn, twitter, birthday, anniversary,
      industry, companySize, annualRevenue
    } = req.body;

    // Basic validation
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const newContact = new Contact({
      name,
      email,
      phone,
      company,
      position,
      address,
      notes,
      tags,
      reference,
      alternativePhone,
      contactType: contactType || 'personal',
      department,
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
      createdBy: userId,
    });

    const savedContact = await newContact.save();
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('contact:created', savedContact);
    }
    
    return res.status(201).json(savedContact);
  } catch (error) {
    console.error('Error creating contact:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: userId || 'unknown',
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ message: 'Error creating contact' });
  }
};

// Update an existing contact
export const updateContact = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { 
      name, email, phone, company, position, address, notes, tags, reference, alternativePhone,
      contactType, department, role, priority, status, website, linkedIn, twitter, birthday, anniversary,
      industry, companySize, annualRevenue
    } = req.body;

    // Find contact and check ownership
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Update fields
    if (name !== undefined) contact.name = name;
    if (email !== undefined) contact.email = email;
    if (phone !== undefined) contact.phone = phone;
    if (company !== undefined) contact.company = company;
    if (position !== undefined) contact.position = position;
    if (address !== undefined) contact.address = address;
    if (notes !== undefined) contact.notes = notes;
    if (tags !== undefined) contact.tags = tags;
    if (reference !== undefined) contact.reference = reference;
    if (alternativePhone !== undefined) contact.alternativePhone = alternativePhone;
    if (contactType !== undefined) contact.contactType = contactType;
    if (department !== undefined) contact.department = department;
    if (role !== undefined) contact.role = role;
    if (priority !== undefined) contact.priority = priority;
    if (status !== undefined) contact.status = status;
    if (website !== undefined) contact.website = website;
    if (linkedIn !== undefined) contact.linkedIn = linkedIn;
    if (twitter !== undefined) contact.twitter = twitter;
    if (birthday !== undefined) contact.birthday = birthday;
    if (anniversary !== undefined) contact.anniversary = anniversary;
    if (industry !== undefined) contact.industry = industry;
    if (companySize !== undefined) contact.companySize = companySize;
    if (annualRevenue !== undefined) contact.annualRevenue = annualRevenue;

    const updatedContact = await contact.save();
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('contact:updated', updatedContact);
    }
    
    return res.status(200).json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return res.status(500).json({ message: 'Error updating contact' });
  }
};

// Delete a contact
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Emit real-time event
    if (global.io) {
      global.io.emit('contact:deleted', req.params.id);
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

    const contacts = await Contact.find({
      createdBy: userId,
      $or: [
        { name: { $regex: sanitizedQuery, $options: 'i' } },
        { email: { $regex: sanitizedQuery, $options: 'i' } },
        { phone: { $regex: sanitizedQuery, $options: 'i' } },
        { company: { $regex: sanitizedQuery, $options: 'i' } },
        { department: { $regex: sanitizedQuery, $options: 'i' } },
        { role: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    }).sort({ name: 1 }).limit(50); // Limit results to prevent performance issues

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

    // Build filter object
    const filter: any = { createdBy: userId };
    
    if (contactType) filter.contactType = contactType;
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (department) filter.department = { $regex: department, $options: 'i' };
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
    
    const [stats, filterOptions] = await Promise.all([
      // Get statistics
      Contact.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byType: {
              $push: {
                type: '$contactType',
                priority: '$priority',
                status: '$status'
              }
            }
          }
        }
      ]),
      
      // Get unique filter options
      Contact.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: null,
            companies: { $addToSet: '$company' },
            departments: { $addToSet: '$department' },
            roles: { $addToSet: '$role' },
            industries: { $addToSet: '$industry' },
            tags: { $addToSet: '$tags' }
          }
        }
      ])
    ]);

    const result = {
      stats: stats[0] || { total: 0, byType: [] },
      filterOptions: {
        companies: filterOptions[0]?.companies?.filter(Boolean) || [],
        departments: filterOptions[0]?.departments?.filter(Boolean) || [],
        roles: filterOptions[0]?.roles?.filter(Boolean) || [],
        industries: filterOptions[0]?.industries?.filter(Boolean) || [],
        tags: filterOptions[0]?.tags?.flat().filter(Boolean) || [],
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