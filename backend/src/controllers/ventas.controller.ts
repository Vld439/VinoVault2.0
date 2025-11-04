import { Response } from 'express';
import * as ventaService from '../services/ventas.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const createVenta = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const ventaData = { ...req.body, usuario_id: req.user?.id };
        const result = await ventaService.crearVenta(ventaData);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getHistorialVentas = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const historial = await ventaService.obtenerHistorialVentas();
        res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial de ventas:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};