import { Request, Response } from 'express';
import { getReporteVentasPorFecha, getReporteStock } from '../services/reportes.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getReporteVentas = async (req: AuthenticatedRequest, res: Response) => {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Se requieren fecha de inicio y fecha de fin.' });
    }

    try {
        const reporte = await getReporteVentasPorFecha(fechaInicio as string, fechaFin as string);
        res.status(200).json(reporte);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getStock = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('Iniciando reporte de stock...');
        const reporte = await getReporteStock();
        console.log('Reporte de stock generado:', reporte.length, 'productos');
        res.status(200).json(reporte);
    } catch (error) {
        console.error('Error en getStock:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};