import { Router } from 'express';
import { getStats, getExchangeRatesData } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticateToken, getStats);
router.get('/exchange-rates', authenticateToken, getExchangeRatesData);

export default router;