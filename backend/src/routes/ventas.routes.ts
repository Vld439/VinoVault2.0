import { Router } from 'express';
import { createVenta } from '../controllers/ventas.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/', authenticateToken, createVenta);
export default router;