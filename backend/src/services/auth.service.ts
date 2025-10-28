import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

interface LoginResult {
  token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
  };
}

export const loginUser = async (email: string, contrasena: string): Promise<LoginResult> => {
    const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
        throw new Error('Credenciales inválidas');
    }

    const user = userResult.rows[0];

    const isPasswordCorrect = await bcrypt.compare(contrasena, user.contrasena_hash);
    if (!isPasswordCorrect) {
        throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre_completo,
            rol: user.rol
        }
    };
};

export const registerUser = async (email: string, contrasena: string, nombre_completo: string, rol: string = 'vendedor') => {
    const existingUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rowCount) {
        throw new Error('El email ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    const newUserResult = await pool.query(
        'INSERT INTO usuarios (email, contrasena_hash, nombre_completo, rol) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, contrasenaHash, nombre_completo, rol]
    );

    const newUser = newUserResult.rows[0];

    return {
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre_completo,
        rol: newUser.rol
    };
};