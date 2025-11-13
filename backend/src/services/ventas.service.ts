import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const crearVenta = async (data: any) => {
    // Recibimos todos los datos, incluyendo el desglose financiero
    const { cliente_id, usuario_id, total, items, almacen_id, moneda, subtotal, impuesto } = data;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar stock para cada item
        for (const item of items) {
            const stockRes = await client.query(
                'SELECT cantidad FROM inventario WHERE producto_id = $1 AND almacen_id = $2 FOR UPDATE',
                [item.producto_id, almacen_id]
            );
            if (stockRes.rowCount === 0 || stockRes.rows[0].cantidad < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto ID: ${item.producto_id}`);
            }
        }

        // 2. Insertar la venta en la tabla 'ventas'
        const ventaRes = await client.query(
            `INSERT INTO ventas (cliente_id, usuario_id, total, moneda, almacen_id, subtotal, impuesto) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [cliente_id, usuario_id, total, moneda, almacen_id, subtotal, impuesto]
        );
        const ventaId = ventaRes.rows[0].id;

        // 3. Insertar cada item en 'venta_items' y actualizar el inventario
        for (const item of items) {
            // Insertar en venta_items
            await client.query(
                'INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
            );
            // Actualizar inventario (restar stock)
            await client.query(
                'UPDATE inventario SET cantidad = cantidad - $1 WHERE producto_id = $2 AND almacen_id = $3',
                [item.cantidad, item.producto_id, almacen_id]
            );
            // Registrar movimiento de stock
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

export const anularVenta = async (ventaId: number, adminId: number, adminPassword: string) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar la contraseña del administrador
        const adminRes = await client.query('SELECT contrasena_hash FROM usuarios WHERE id = $1 AND rol = \'admin\'', [adminId]);
        if (adminRes.rowCount === 0) throw new Error('Usuario administrador no válido.');
        
        const isPasswordCorrect = await bcrypt.compare(adminPassword, adminRes.rows[0].contrasena_hash);
        if (!isPasswordCorrect) throw new Error('Contraseña incorrecta.');

        // 2. Verificar que la venta no esté ya anulada
        const ventaRes = await client.query('SELECT * FROM ventas WHERE id = $1', [ventaId]);
        if (ventaRes.rowCount === 0) throw new Error('Venta no encontrada.');
        if (ventaRes.rows[0].estado === 'Anulada') throw new Error('Esta venta ya ha sido anulada.');
        
        const almacenId = ventaRes.rows[0].almacen_id;

        // 3. Obtener los items de la venta para revertir el stock
        const itemsRes = await client.query('SELECT producto_id, cantidad FROM venta_items WHERE venta_id = $1', [ventaId]);

        for (const item of itemsRes.rows) {
            // 3a. Revertir el stock en la tabla 'inventario' (sumar de nuevo la cantidad)
            await client.query(
                `INSERT INTO inventario (producto_id, almacen_id, cantidad)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (producto_id, almacen_id)
                 DO UPDATE SET cantidad = inventario.cantidad + $3`,
                [item.producto_id, almacenId, item.cantidad]
            );
            // 3b. Registrar el movimiento de anulación
            await client.query(
                'INSERT INTO movimientos_stock (producto_id, almacen_id, cantidad, tipo_movimiento, usuario_id) VALUES ($1, $2, $3, $4, $5)',
                [item.producto_id, almacenId, item.cantidad, 'Anulación de Venta', adminId]
            );
        }

        // 4. Finalmente, cambiar el estado de la venta a 'Anulada'
        await client.query("UPDATE ventas SET estado = 'Anulada' WHERE id = $1", [ventaId]);

        await client.query('COMMIT');
        return { success: true, message: 'Venta anulada correctamente.' };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en transacción de anulación de venta:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const obtenerHistorialVentas = async () => {
    const query = `
        SELECT 
            v.id,
            v.fecha_venta,
            c.nombre AS cliente_nombre,
            u.nombre_completo AS usuario_nombre,
            a.nombre AS almacen_nombre,
            v.subtotal,
            COALESCE(v.impuesto, 0) AS impuestos,
            v.total,
            v.moneda,
            (SELECT json_agg(
                json_build_object(
                    'nombre_producto', p.nombre,
                    'cantidad', vi.cantidad,
                    'precio_unitario', vi.precio_unitario
                )
            ) FROM venta_items vi 
            JOIN productos p ON vi.producto_id = p.id 
            WHERE vi.venta_id = v.id) as items
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.id
        JOIN usuarios u ON v.usuario_id = u.id
        JOIN almacenes a ON v.almacen_id = a.id
        ORDER BY v.fecha_venta DESC
        LIMIT 100;
    `;

    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error("Error al obtener historial de ventas:", error);
        throw new Error('Error al obtener el historial de ventas.');
    }
};