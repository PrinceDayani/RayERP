import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getCustomers,
  getContactStats,
  contactRateLimit,
  validateContactCreation,
  validateContactUpdate,
  validateContactId
} from '../controllers/contactController';
import { contactHealthChecker } from '../utils/contactHealthCheck';

const router = Router();

// Health check endpoint (no auth required for monitoring)
router.get('/health', async (req, res) => {
  try {
    const health = await contactHealthChecker.performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;
    res.status(statusCode).json({ success: true, data: health });
  } catch (error) {
    res.status(503).json({ 
      success: false, 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed metrics endpoint (requires auth)
router.get('/metrics', protect, async (req, res) => {
  try {
    const metrics = await contactHealthChecker.getDetailedMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply authentication and rate limiting to other routes
router.use(protect);
router.use(contactRateLimit);

// Routes with validation
router.get('/', getContacts);
router.get('/customers', getCustomers);
router.get('/search', searchContacts);
router.get('/stats', getContactStats);
router.get('/:id', validateContactId, getContactById);
router.post('/', validateContactCreation, createContact);
router.put('/:id', validateContactUpdate, updateContact);
router.delete('/:id', validateContactId, deleteContact);

export default router;