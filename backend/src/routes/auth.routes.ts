import { Router } from 'express';
import { handleLogin, handleRegister } from '../controllers/auth.controller.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', handleLogin);
router.post('/register', authenticateToken, authorizeAdmin, handleRegister);

export default router;