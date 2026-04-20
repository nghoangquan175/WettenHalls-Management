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
/**
 * @openapi
 * /api/articles/published:
 *   get:
 *     tags: [Articles]
 *     summary: Get all published articles
 */
router.get('/published', getPublishedArticles);
/**
 * @openapi
 * /api/articles/public/{slug}:
 *   get:
 *     tags: [Articles]
 *     summary: Get a published article by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 */
router.get('/public/:slug', getArticleBySlug);

// Get list and single article (All authenticated staff)
/**
 * @openapi
 * /api/articles:
 *   get:
 *     tags: [Articles]
 *     summary: List all articles (Staff only)
 *     security: [{ sessionAuth: [] }]
 */
router.get('/', isAuthenticated, getArticles);
/**
 * @openapi
 * /api/articles/trash:
 *   get:
 *     tags: [Articles]
 *     summary: Get soft-deleted articles
 */
router.get('/trash', isAuthenticated, getTrash);
/**
 * @openapi
 * /api/articles/{id}:
 *   get:
 *     tags: [Articles]
 *     summary: Get article by ID
 */
router.get('/:id', isAuthenticated, getArticleById);

// Create and Update (All authenticated staff)
/**
 * @openapi
 * /api/articles:
 *   post:
 *     tags: [Articles]
 *     summary: Create a new article
 */
router.post('/', isAuthenticated, createArticle);
/**
 * @openapi
 * /api/articles/{id}:
 *   put:
 *     tags: [Articles]
 *     summary: Update an article
 */
router.put('/:id', isAuthenticated, updateArticle);

// Status management (Both SA and ADMIN)
/**
 * @openapi
 * /api/articles/{id}/status:
 *   patch:
 *     tags: [Articles]
 *     summary: Update article status
 */
router.patch('/:id/status', isAuthenticated, updateArticleStatus);

// Soft Delete, Restore, and Permanent Delete
/**
 * @openapi
 * /api/articles/{id}:
 *   delete:
 *     tags: [Articles]
 *     summary: Soft delete an article
 */
router.delete('/:id', isAuthenticated, deleteArticle);
/**
 * @openapi
 * /api/articles/{id}/restore:
 *   patch:
 *     tags: [Articles]
 *     summary: Restore a soft-deleted article
 */
router.patch('/:id/restore', isAuthenticated, restoreArticle);
/**
 * @openapi
 * /api/articles/{id}/permanent:
 *   delete:
 *     tags: [Articles]
 *     summary: Permanently delete an article
 */
router.delete('/:id/permanent', isAuthenticated, permanentDelete);

export default router;
