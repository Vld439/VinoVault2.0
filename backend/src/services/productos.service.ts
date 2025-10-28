import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteProductById = async (id: number): Promise<boolean> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const selectRes = await client.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        if (selectRes.rowCount === 0) {
            throw new Error('Producto no encontrado');
        }
        const imageUrl = selectRes.rows[0].imagen_url;

        const deleteRes = await client.query('DELETE FROM productos WHERE id = $1', [id]);
        if (deleteRes.rowCount === 0) {
            throw new Error('No se pudo eliminar el producto');
        }

        if (imageUrl) {
            const imagePath = path.join(__dirname, '../../', imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en la transacción de borrado:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const removeImageFromProduct = async (id: number) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const selectRes = await client.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        if (selectRes.rowCount === 0) {
            throw new Error('Producto no encontrado');
        }
        const imageUrl = selectRes.rows[0].imagen_url;

        if (imageUrl) {
            const imagePath = path.join(__dirname, '../../', imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const updateRes = await client.query(
            'UPDATE productos SET imagen_url = NULL WHERE id = $1 RETURNING *',
            [id]
        );

        await client.query('COMMIT');
        return updateRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al remover la imagen del producto:", error);
        throw error;
    } finally {
        client.release();
    }
};
export const updateProductById = async (id: number, data: any) => {
    const { sku, nombre, descripcion, precio_compra, precio_venta } = data;
    try {
        const result = await pool.query(
            `UPDATE productos 
             SET sku = $1, nombre = $2, descripcion = $3, precio_compra = $4, precio_venta = $5
             WHERE id = $6 RETURNING *`,
            [sku, nombre, descripcion, precio_compra, precio_venta, id]
        );

        if (result.rowCount === 0) {
            throw new Error('Producto no encontrado');
        }
        return result.rows[0];
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        throw error;
    }
};