import { Response } from 'express';
import { getHistorialMovimientos, registrarMovimientoStock } from '../services/inventario.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const handleMovimientoStock = async (req: AuthenticatedRequest, res: Response) => {
    const { producto_id, almacen_id, cantidad, tipo_movimiento } = req.body;
    const usuario_id = req.user?.id;

    if (!producto_id || !almacen_id || !cantidad || !tipo_movimiento || !usuario_id) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }

    try {
        const result = await registrarMovimientoStock({
            producto_id,
            almacen_id,
            cantidad: Number(cantidad),
            tipo_movimiento,
            usuario_id
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
export const getHistorial = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const historial = await getHistorialMovimientos();
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};