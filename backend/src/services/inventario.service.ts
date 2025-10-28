import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

interface MovimientoData {
    producto_id: number;
    almacen_id: number;
    cantidad: number;
    tipo_movimiento: 'Entrada Manual' | 'Salida Manual' | 'Ajuste';
    usuario_id: number;
}

export const registrarMovimientoStock = async (data: MovimientoData) => {
    const { producto_id, almacen_id, cantidad, tipo_movimiento, usuario_id } = data;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO movimientos_stock (producto_id, almacen_id, cantidad, tipo_movimiento, usuario_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [producto_id, almacen_id, cantidad, tipo_movimiento, usuario_id]
        );

        await client.query(
            `INSERT INTO inventario (producto_id, almacen_id, cantidad)
             VALUES ($1, $2, $3)
             ON CONFLICT (producto_id, almacen_id) 
             DO UPDATE SET cantidad = inventario.cantidad + $3`,
            [producto_id, almacen_id, cantidad]
        );

        await client.query('COMMIT');
        return { success: true, message: 'Movimiento de stock registrado correctamente.' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en la transacción de movimiento de stock:", error);
        throw new Error('No se pudo registrar el movimiento de stock.');
    } finally {
        client.release();
    }
};

export const getHistorialMovimientos = async () => {
    try {
        const query = `
            SELECT
                m.id,
                m.cantidad,
                m.tipo_movimiento,
                m.fecha_movimiento,
                p.nombre AS producto_nombre,
                a.nombre AS almacen_nombre,
                u.nombre_completo AS usuario_nombre
            FROM
                movimientos_stock m
            JOIN
                productos p ON m.producto_id = p.id
            JOIN
                almacenes a ON m.almacen_id = a.id
            JOIN
                usuarios u ON m.usuario_id = u.id
            ORDER BY
                m.fecha_movimiento DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error("Error al obtener el historial de movimientos:", error);
        throw new Error('No se pudo obtener el historial de movimientos.');
    }
};