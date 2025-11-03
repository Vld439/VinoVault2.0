import { Pool } from 'pg';
import { endOfDay, parseISO } from 'date-fns';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const getReporteVentasPorFecha = async (fechaInicio: string, fechaFin: string) => {
    const inicio = parseISO(fechaInicio);
    const fin = endOfDay(parseISO(fechaFin));

    const query = `
        SELECT
            v.id,
            v.fecha_venta,
            c.nombre AS cliente_nombre,
            u.nombre_completo AS vendedor_nombre,
            v.subtotal,
            v.impuesto,
            v.total,
            v.moneda,
            v.estado,
            (SELECT json_agg(
                json_build_object(
                    'producto_nombre', p.nombre,
                    'cantidad', vi.cantidad,
                    'precio_unitario', vi.precio_unitario
                )
            ) FROM venta_items vi JOIN productos p ON vi.producto_id = p.id WHERE vi.venta_id = v.id) as items
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.id
        JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.fecha_venta BETWEEN $1 AND $2
        ORDER BY v.fecha_venta DESC;
    `;

    try {
        const result = await pool.query(query, [inicio, fin]);
        return result.rows;
    } catch (error) {
        console.error("Error al generar el reporte de ventas:", error);
        throw new Error('Error al generar el reporte.');
    }
};

export const getReporteStock = async () => {
    const query = `
        SELECT
            p.id,
            p.sku,
            p.nombre,
            p.descripcion,
            p.precio_compra,
            p.precio_venta,
            COALESCE(SUM(i.cantidad), 0) as total_stock,
            CASE 
                WHEN COALESCE(SUM(i.cantidad), 0) = 0 THEN 'Crítico'
                WHEN COALESCE(SUM(i.cantidad), 0) <= 5 THEN 'Crítico'
                WHEN COALESCE(SUM(i.cantidad), 0) <= 10 THEN 'Bajo' 
                WHEN COALESCE(SUM(i.cantidad), 0) <= 15 THEN 'Normal'
                ELSE 'Alto'
            END as estado_stock
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        GROUP BY p.id, p.sku, p.nombre, p.descripcion, p.precio_compra, p.precio_venta
        ORDER BY p.nombre;
    `;

    try {
        console.log('Ejecutando consulta de stock:', query);
        const result = await pool.query(query);
        console.log('Resultado de consulta stock:', result.rows.length, 'filas');
        return result.rows;
    } catch (error) {
        console.error("Error al generar el reporte de stock:", error);
        throw new Error('Error al generar el reporte de stock.');
    }
};