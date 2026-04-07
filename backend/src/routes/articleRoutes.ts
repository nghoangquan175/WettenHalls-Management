import { Router } from 'express';
import { 
    createArticle, 
    getArticles, 
    getArticleById, 
    updateArticle, 
    deleteArticle,
    updateArticleStatus,
    getTrash,
    restoreArticle,
    permanentDelete
} from '../controllers/articleController';
import { isAuthenticated, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Get list and single article (All authenticated staff)
router.get('/', isAuthenticated, getArticles);
router.get('/trash', isAuthenticated, getTrash);
router.get('/:id', isAuthenticated, getArticleById);

// Create and Update (All authenticated staff)
router.post('/', isAuthenticated, createArticle);
router.put('/:id', isAuthenticated, updateArticle);

// Status management (SUPER_ADMIN only)
router.patch('/:id/status', isAuthenticated, authorizeRoles('SUPER_ADMIN'), updateArticleStatus);

// Soft Delete, Restore, and Permanent Delete
router.delete('/:id', isAuthenticated, deleteArticle);
router.patch('/:id/restore', isAuthenticated, restoreArticle);
router.delete('/:id/permanent', isAuthenticated, permanentDelete);

export default router;
