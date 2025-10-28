import { Request, Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export const getAllAlmacenes = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM almacenes ORDER BY nombre ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los almacenes' });
    }
};