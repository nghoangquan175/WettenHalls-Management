import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';
import { uploadSingle } from '../middleware/upload';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

router.post('/image', isAuthenticated, uploadSingle, uploadImage);

export default router;
