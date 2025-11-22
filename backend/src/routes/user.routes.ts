import { Router } from "express";
import { getAllUsers, getUserById, updateUserRole, resetUserPassword, bulkUpdateUserRoles, getProfile, updateProfile, changePassword, deleteUser, getCompleteProfile, uploadAvatar } from '../controllers/userController';
import { protect } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get("/me", protect, getProfile);
router.get("/profile", protect, getProfile);
router.get("/profile/complete", protect, getCompleteProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single('avatar'), uploadAvatar);
router.put("/change-password", protect, changePassword);
router.get("/", protect, getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/bulk/role", protect, requireRole(['Superadmin', 'Root']), bulkUpdateUserRoles);
router.put("/:id/role", protect, requireRole(['Superadmin', 'Root']), updateUserRole);
router.put("/:id/reset-password", protect, requireRole(['Superadmin', 'Root']), resetUserPassword);
router.delete("/:id", protect, requireRole(['Superadmin', 'Root']), deleteUser);

export default router;
