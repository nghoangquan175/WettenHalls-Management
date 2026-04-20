import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';
import { uploadSingle } from '../middleware/upload';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

/**
 * @openapi
 * /api/upload/image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload an image to Cloudinary
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 */
router.post('/image', isAuthenticated, uploadSingle, uploadImage);

export default router;
