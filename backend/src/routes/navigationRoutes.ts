import { Router } from 'express';
import {
  listVersions,
  getActiveVersion,
  getVersionById,
  createVersion,
  updateVersion,
  activateVersion,
  deleteVersion,
  getPublicNavigation
} from '../controllers/navigationController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

// Public/Semi-public (could be moved to public articles/site route later)
router.get('/active', getActiveVersion);
router.get('/public', getPublicNavigation);

// Admin Routes (Authenticated)
router.get('/', isAuthenticated, listVersions);
router.get('/:id', isAuthenticated, getVersionById);
router.post('/', isAuthenticated, createVersion);
router.put('/:id', isAuthenticated, updateVersion);
router.patch('/:id/activate', isAuthenticated, activateVersion);
router.delete('/:id', isAuthenticated, deleteVersion);

export default router;
