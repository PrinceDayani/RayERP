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

// Get all contacts for the logged-in user
export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contacts = await Contact.find({ createdBy: userId })
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
  try {
    const userId = getUserId(req);
    const { name, email, phone, company, position, address, notes, tags, reference, alternativePhone } = req.body;

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
      createdBy: userId,
    });

    const savedContact = await newContact.save();
    return res.status(201).json(savedContact);
  } catch (error) {
    console.error('Error creating contact:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ message: 'Error creating contact' });
  }
};

// Update an existing contact
export const updateContact = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, email, phone, company, position, address, notes, tags, reference, alternativePhone } = req.body;

    // Find contact and check ownership
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Update fields
    contact.name = name || contact.name;
    contact.email = email || contact.email;
    contact.phone = phone || contact.phone;
    contact.company = company || contact.company;
    contact.position = position || contact.position;
    contact.address = address || contact.address;
    contact.notes = notes || contact.notes;
    contact.tags = tags || contact.tags;
    contact.reference = reference || contact.reference;
    contact.alternativePhone = alternativePhone || contact.alternativePhone;

    const updatedContact = await contact.save();
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

    return res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({ message: 'Error deleting contact' });
  }
};

// Search contacts
export const searchContacts = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
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
      ],
    }).sort({ name: 1 }).limit(50); // Limit results to prevent performance issues

    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ message: 'Error searching contacts' });
  }
};