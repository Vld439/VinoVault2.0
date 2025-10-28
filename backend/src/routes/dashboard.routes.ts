import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticateToken, getStats);

export default router;