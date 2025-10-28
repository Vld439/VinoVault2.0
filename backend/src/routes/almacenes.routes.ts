import { Router } from 'express';
import { getAllAlmacenes } from '../controllers/almacenes.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getAllAlmacenes);

export default router;