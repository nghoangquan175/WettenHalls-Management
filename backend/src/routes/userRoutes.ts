import express from 'express';
import { getDashboardStats, createUser, getUsers, updateUserStatus, deleteUser } from '../controllers/userController';
import { isAuthenticated, authorizeRoles } from '../middleware/authMiddleware';
import { createUserValidator } from '../middleware/userValidator';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.get('/stats', isAuthenticated, authorizeRoles('SUPER_ADMIN', 'ADMIN'), getDashboardStats);

router.post('/', isAuthenticated, authorizeRoles('SUPER_ADMIN'), createUserValidator, validateRequest, createUser);
router.get('/', isAuthenticated, authorizeRoles('SUPER_ADMIN'), getUsers);
router.patch('/:id/status', isAuthenticated, authorizeRoles('SUPER_ADMIN'), updateUserStatus);
router.delete('/:id', isAuthenticated, authorizeRoles('SUPER_ADMIN'), deleteUser);

export default router;