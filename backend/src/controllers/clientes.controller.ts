import { Request, Response } from 'express';
import * as clienteService from '../services/clientes.service.js';

export const getClientes = async (req: Request, res: Response) => {
    try {
        const clientes = await clienteService.getAllClientesWithStats();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

export const createCliente = async (req: Request, res: Response) => {
    try {
        const newCliente = await clienteService.createCliente(req.body);
        res.status(201).json(newCliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear cliente' });
    }
};
export const getClienteDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const details = await clienteService.getClienteDetailsById(Number(id));
        res.status(200).json(details);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const updateCliente = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedCliente = await clienteService.updateClienteById(Number(id), req.body);
        res.status(200).json(updatedCliente);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteCliente = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await clienteService.deleteClienteById(Number(id));
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};