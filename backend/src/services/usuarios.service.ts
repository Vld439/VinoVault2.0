import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const getAllUsers = async () => {
    const result = await pool.query('SELECT id, email, nombre_completo, rol FROM usuarios ORDER BY nombre_completo ASC');
    return result.rows;
};

export const updateUserById = async (id: number, data: any) => {
    const { email, nombre_completo, rol } = data;
    const result = await pool.query(
        'UPDATE usuarios SET email = $1, nombre_completo = $2, rol = $3 WHERE id = $4 RETURNING id, email, nombre_completo, rol',
        [email, nombre_completo, rol, id]
    );
    if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
    }
    return result.rows[0];
};

export const deleteUserById = async (id: number) => {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
    }
    return { success: true };
};