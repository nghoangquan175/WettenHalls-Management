import express from 'express';
import { loginUser, logoutUser, getMe } from '../controllers/authController';
import { isAuthenticated } from '../middleware/authMiddleware';
import { loginValidator } from '../middleware/userValidator';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.post('/login', loginValidator, validateRequest, loginUser);
router.post('/logout', isAuthenticated, logoutUser);
router.get('/me', isAuthenticated, getMe);

export default router;
