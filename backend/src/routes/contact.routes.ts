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

router.use(protect);

router.get('/', getContacts);
router.get('/search', searchContacts);
router.get('/filter', filterContacts);
router.get('/stats', getContactStats);
router.get('/:id', getContactById);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;