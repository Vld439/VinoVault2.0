import { Router } from 'express';
import { getHistorial, handleMovimientoStock } from '../controllers/inventario.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/movimiento', authenticateToken, handleMovimientoStock);
router.get('/historial', authenticateToken, getHistorial);

export default router;