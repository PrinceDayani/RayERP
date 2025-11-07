import { Router } from "express";
import { getAllUsers, getUserById, updateUserRole, resetUserPassword } from '../controllers/userController';
import { protect } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get("/", protect, requireRole(['Superadmin', 'Root']), getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/:id/role", protect, requireRole(['Superadmin', 'Root']), updateUserRole);
router.put("/:id/reset-password", protect, requireRole(['Superadmin', 'Root']), resetUserPassword);

export default router;
