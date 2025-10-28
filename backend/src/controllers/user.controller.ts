import { Request, Response } from 'express';
import { Pool } from 'pg';
import * as usuarioService from '../services/usuarios.service.js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const result = await pool.query(
            'SELECT id, email, nombre_completo, rol FROM usuarios WHERE id = $1',
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await usuarioService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedUser = await usuarioService.updateUserById(Number(id), req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await usuarioService.deleteUserById(Number(id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};