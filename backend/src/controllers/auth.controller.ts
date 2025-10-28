import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service.js';

export const handleLogin = async (req: Request, res: Response) => {
    const { email, contrasena } = req.body;
    console.log(`[BACKEND] Intento de login recibido para el email: ${email}`);

    if (!email || !contrasena) {
        console.log('[BACKEND] Error: Faltan email o contraseña.');
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    try {
        const loginData = await loginUser(email, contrasena);
        console.log('[BACKEND] Login exitoso. Enviando token y datos de usuario.');
        res.status(200).json(loginData);
    } catch (error) {
        console.error('[BACKEND] Error en el servicio de login:', (error as Error).message);
        res.status(401).json({ message: (error as Error).message });
    }
};

export const handleRegister = async (req: Request, res: Response) => {
    const { email, contrasena, nombre_completo } = req.body;

    if (!email || !contrasena || !nombre_completo) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const newUser = await registerUser(email, contrasena, nombre_completo);
        res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
    } catch (error) {
        res.status(409).json({ message: (error as Error).message });
    }
};
