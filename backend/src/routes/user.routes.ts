import { Router } from "express";
import { getAllUsers, getUserById, updateUserRole, resetUserPassword, bulkUpdateUserRoles, getProfile, updateProfile, changePassword, deleteUser, getCompleteProfile, uploadAvatar } from '../controllers/userController';
import { createUser, updateUser } from '../controllers/userManagementController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get("/me", protect, getProfile);
router.get("/profile", protect, getProfile);
router.get("/profile/complete", protect, getCompleteProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single('avatar'), uploadAvatar);
router.put("/change-password", protect, changePassword);
router.post("/", protect, requirePermission('users.create'), createUser);
router.get("/", protect, requirePermission('users.view'), getAllUsers);
router.get("/:id", protect, requirePermission('users.view'), getUserById);
router.put("/:id", protect, requirePermission('users.edit'), updateUser);
router.put("/bulk/role", protect, requirePermission('users.assign_roles'), bulkUpdateUserRoles);
router.put("/:id/role", protect, requirePermission('users.assign_roles'), updateUserRole);
router.put("/:id/reset-password", protect, requirePermission('users.reset_password'), resetUserPassword);
router.put("/:id/activate", protect, requirePermission('users.activate_deactivate'), async (req, res) => {
  try {
    const user = await (await import('../models/User')).default.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User activated', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put("/:id/deactivate", protect, requirePermission('users.activate_deactivate'), async (req, res) => {
  try {
    const user = await (await import('../models/User')).default.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete("/:id", protect, requirePermission('users.delete'), deleteUser);

export default router;
