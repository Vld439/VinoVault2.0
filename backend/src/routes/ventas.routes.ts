import { Router } from 'express';
import { createVenta, getHistorialVentas } from '../controllers/ventas.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/', authenticateToken, createVenta);
router.get('/historial', authenticateToken, getHistorialVentas);
export default router;