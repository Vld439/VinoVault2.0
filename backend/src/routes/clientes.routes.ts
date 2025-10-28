import { Router } from 'express';
import { getClientes, createCliente, getClienteDetails, deleteCliente, updateCliente } from '../controllers/clientes.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', authenticateToken, getClientes);
router.post('/', authenticateToken, createCliente);
router.get('/:id/detalles', authenticateToken, getClienteDetails);
router.put('/:id', authenticateToken, updateCliente);
router.delete('/:id', authenticateToken, deleteCliente);
export default router;