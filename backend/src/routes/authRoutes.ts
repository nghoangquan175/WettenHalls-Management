import express from 'express';
import {
  loginUser,
  logoutUser,
  getMe,
  registerUser,
  forgotPassword,
  resetPassword,
  verifyOTP,
} from '../controllers/authController';
import { isAuthenticated } from '../middleware/authMiddleware';
import { loginValidator } from '../middleware/userValidator';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User Login
 *     description: Authenticate user and create session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidator, validateRequest, loginUser);
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', registerUser);
/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify OTP for registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200: { description: OTP verified }
 */
router.post('/verify-otp', verifyOTP);
/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request password reset link
 */
router.post('/forgot-password', forgotPassword);
/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password using token
 */
router.post('/reset-password', resetPassword);
/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 */
router.post('/logout', isAuthenticated, logoutUser);
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated user
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', isAuthenticated, getMe);

export default router;
