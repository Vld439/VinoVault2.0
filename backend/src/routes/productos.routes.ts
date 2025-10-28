import { Router } from 'express';
import { getAllProducts, createProduct, deleteProduct, updateProductImage, removeProductImage, getProductById, updateProduct } from '../controllers/productos.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', authenticateToken, getAllProducts);
router.get('/:id', authenticateToken, getProductById);
router.post('/', authenticateToken, upload.single('imagen'), createProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.put('/:id/imagen', authenticateToken, upload.single('imagen'), updateProductImage);
router.delete('/:id/imagen', authenticateToken, removeProductImage);
router.put('/:id', authenticateToken, updateProduct);

export default router;