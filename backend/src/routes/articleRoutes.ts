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
  permanentDelete,
  getPublishedArticles,
  getArticleBySlug,
} from '../controllers/articleController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/published', getPublishedArticles);
router.get('/public/:slug', getArticleBySlug);

// Get list and single article (All authenticated staff)
router.get('/', isAuthenticated, getArticles);
router.get('/trash', isAuthenticated, getTrash);
router.get('/:id', isAuthenticated, getArticleById);

// Create and Update (All authenticated staff)
router.post('/', isAuthenticated, createArticle);
router.put('/:id', isAuthenticated, updateArticle);

// Status management (Both SA and ADMIN)
router.patch('/:id/status', isAuthenticated, updateArticleStatus);

// Soft Delete, Restore, and Permanent Delete
router.delete('/:id', isAuthenticated, deleteArticle);
router.patch('/:id/restore', isAuthenticated, restoreArticle);
router.delete('/:id/permanent', isAuthenticated, permanentDelete);

export default router;
