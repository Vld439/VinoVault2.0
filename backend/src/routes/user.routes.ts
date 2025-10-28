import { Router } from 'express';
import { getUserProfile, getUsers, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, authorizeAdmin, getUsers);
router.put('/:id', authenticateToken, authorizeAdmin, updateUser);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteUser);
router.get('/:id', authenticateToken, getUserProfile);

export default router;