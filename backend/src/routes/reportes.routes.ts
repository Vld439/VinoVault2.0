import { Router } from 'express';
import { getReporteVentas, getStock } from '../controllers/reportes.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/ventas', authenticateToken, getReporteVentas);
router.get('/stock', authenticateToken, getStock);

export default router;