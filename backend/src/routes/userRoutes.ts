import express from 'express';
import {
  getDashboardStats,
  createUser,
  getUsers,
  updateUserStatus,
  deleteUser,
  updateUserPermissions,
} from '../controllers/userController';
import { isAuthenticated, authorizeRoles } from '../middleware/authMiddleware';
import { createUserValidator } from '../middleware/userValidator';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

/**
 * @openapi
 * /api/users/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get dashboard statistics
 *     security: [{ sessionAuth: [] }]
 */
router.get(
  '/stats',
  isAuthenticated,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  getDashboardStats
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Super Admin only)
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, GUEST] }
 */
router.post(
  '/',
  isAuthenticated,
  authorizeRoles('SUPER_ADMIN'),
  createUserValidator,
  validateRequest,
  createUser
);
/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     security: [{ sessionAuth: [] }]
 */
router.get('/', isAuthenticated, authorizeRoles('SUPER_ADMIN'), getUsers);
/**
 * @openapi
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Update user status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.patch(
  '/:id/status',
  isAuthenticated,
  authorizeRoles('SUPER_ADMIN'),
  updateUserStatus
);
/**
 * @openapi
 * /api/users/{id}/permissions:
 *   patch:
 *     tags: [Users]
 *     summary: Update user permissions
 */
router.patch(
  '/:id/permissions',
  isAuthenticated,
  authorizeRoles('SUPER_ADMIN'),
  updateUserPermissions
);
/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 */
router.delete(
  '/:id',
  isAuthenticated,
  authorizeRoles('SUPER_ADMIN'),
  deleteUser
);

export default router;
