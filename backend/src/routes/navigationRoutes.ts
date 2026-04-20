import { Router } from 'express';
import {
  listVersions,
  getActiveVersion,
  getVersionById,
  createVersion,
  updateVersion,
  activateVersion,
  deleteVersion,
  getPublicNavigation,
} from '../controllers/navigationController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

// Public/Semi-public (could be moved to public articles/site route later)
/**
 * @openapi
 * /api/navigation/active:
 *   get:
 *     tags: [Navigation]
 *     summary: Get active navigation configuration
 */
router.get('/active', getActiveVersion);
/**
 * @openapi
 * /api/navigation/public:
 *   get:
 *     tags: [Navigation]
 *     summary: Get public navigation items
 */
router.get('/public', getPublicNavigation);

// Admin Routes (Authenticated)
/**
 * @openapi
 * /api/navigation:
 *   get:
 *     tags: [Navigation]
 *     summary: List all navigation versions
 */
router.get('/', isAuthenticated, listVersions);
/**
 * @openapi
 * /api/navigation/{id}:
 *   get:
 *     tags: [Navigation]
 *     summary: Get navigation version by ID
 */
router.get('/:id', isAuthenticated, getVersionById);
/**
 * @openapi
 * /api/navigation:
 *   post:
 *     tags: [Navigation]
 *     summary: Create a new navigation version
 */
router.post('/', isAuthenticated, createVersion);
/**
 * @openapi
 * /api/navigation/{id}:
 *   put:
 *     tags: [Navigation]
 *     summary: Update navigation version
 */
router.put('/:id', isAuthenticated, updateVersion);
/**
 * @openapi
 * /api/navigation/{id}/activate:
 *   patch:
 *     tags: [Navigation]
 *     summary: Set a navigation version as active
 */
router.patch('/:id/activate', isAuthenticated, activateVersion);
/**
 * @openapi
 * /api/navigation/{id}:
 *   delete:
 *     tags: [Navigation]
 *     summary: Delete a navigation version
 */
router.delete('/:id', isAuthenticated, deleteVersion);

export default router;
