import express from 'express';
import { loginUser, logoutUser, getMe, registerUser, forgotPassword, resetPassword, verifyOTP } from '../controllers/authController';
import { isAuthenticated } from '../middleware/authMiddleware';
import { loginValidator } from '../middleware/userValidator';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.post('/login', loginValidator, validateRequest, loginUser);
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', isAuthenticated, logoutUser);
router.get('/me', isAuthenticated, getMe);

export default router;
