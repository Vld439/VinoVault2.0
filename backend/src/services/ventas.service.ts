import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const crearVenta = async (data: any) => {
    const { cliente_id, usuario_id, total, items, almacen_id, moneda } = data;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const item of items) {
            const stockRes = await client.query(
                'SELECT cantidad FROM inventario WHERE producto_id = $1 AND almacen_id = $2',
                [item.producto_id, almacen_id]
            );
            if (stockRes.rowCount === 0 || stockRes.rows[0].cantidad < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto ID: ${item.producto_id}`);
            }
        }

        const ventaRes = await client.query(
            'INSERT INTO ventas (cliente_id, usuario_id, total, moneda) VALUES ($1, $2, $3, $4) RETURNING id',
            [cliente_id, usuario_id, total, moneda]
        );
        const ventaId = ventaRes.rows[0].id;

        for (const item of items) {
            await client.query(
                'INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
            );

            await client.query(
                'UPDATE inventario SET cantidad = cantidad - $1 WHERE producto_id = $2 AND almacen_id = $3',
                [item.cantidad, item.producto_id, almacen_id]
            );

            await client.query(
                'INSERT INTO movimientos_stock (producto_id, almacen_id, cantidad, tipo_movimiento, usuario_id) VALUES ($1, $2, $3, $4, $5)',
                [item.producto_id, almacen_id, -item.cantidad, 'Salida por Venta', usuario_id]
            );
        }

        await client.query('COMMIT');
        return { success: true, ventaId };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en transacción de venta:", error);
        throw error;
    } finally {
        client.release();
    }
};