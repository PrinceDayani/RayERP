import { Router } from "express";
import { getAllUsers, getUserById, updateUserRole, resetUserPassword, bulkUpdateUserRoles, getProfile, updateProfile, changePassword } from '../controllers/userController';
import { protect } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/", protect, requireRole(['Superadmin', 'Root']), getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/bulk/role", protect, requireRole(['Superadmin', 'Root']), bulkUpdateUserRoles);
router.put("/:id/role", protect, requireRole(['Superadmin', 'Root']), updateUserRole);
router.put("/:id/reset-password", protect, requireRole(['Superadmin', 'Root']), resetUserPassword);

export default router;
