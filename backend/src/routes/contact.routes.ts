// backend/src/routes/contact.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  filterContacts,
  getContactStats
} from '../controllers/contactController';

const router = Router();

// All routes require authentication
router.use(protect);

// GET all contacts
router.get('/', getContacts);

// GET search contacts
router.get('/search', searchContacts);

// GET filter contacts with advanced options
router.get('/filter', filterContacts);

// GET contact statistics and filter options
router.get('/stats', getContactStats);

// GET single contact
router.get('/:id', getContactById);

// POST create new contact
router.post('/', createContact);

// PUT update contact
router.put('/:id', updateContact);

// DELETE contact
router.delete('/:id', deleteContact);

export default router;