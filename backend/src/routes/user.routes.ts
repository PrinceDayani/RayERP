import { Router } from "express";
import { getAllUsers, getUserById, updateUserRole, resetUserPassword, changeUserPassword, bulkUpdateUserRoles, getProfile, updateProfile, changePassword, deleteUser, getCompleteProfile, uploadAvatar, getPendingStatusRequests, approveStatusRequest, rejectStatusRequest } from '../controllers/userController';
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
router.put("/:id/change-password", protect, requirePermission('users.change_password'), changeUserPassword);
router.put("/:id/status", protect, requirePermission('users.activate_deactivate'), async (req, res) => {
  const { updateUserStatus } = await import('../controllers/userController');
  return updateUserStatus(req, res);
});
router.get("/status-requests/pending", protect, requirePermission('users.approve_status'), getPendingStatusRequests);
router.put("/status-requests/:id/approve", protect, requirePermission('users.approve_status'), approveStatusRequest);
router.put("/status-requests/:id/reject", protect, requirePermission('users.approve_status'), rejectStatusRequest);
router.delete("/:id", protect, requirePermission('users.delete'), deleteUser);

export default router;
