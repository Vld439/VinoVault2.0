import { Pool } from 'pg';
import { getExchangeRates } from './exchangeRate.service.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const getAllClientesWithStats = async () => {
    const query = `
        SELECT
            c.id,
            c.nombre,
            c.email,
            c.telefono,
            c.ruc,
            c.fecha_registro,
            c.es_extranjero,
            COUNT(v.id) AS numero_de_compras,
            COALESCE(SUM(v.total), 0) AS gasto_total_usd
        FROM
            clientes c
        LEFT JOIN
            ventas v ON c.id = v.cliente_id AND v.moneda = 'USD'
        GROUP BY
            c.id
        ORDER BY
            c.nombre ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export const createCliente = async (data: any) => {
    const { nombre, ruc, telefono, email, es_extranjero } = data;
    const result = await pool.query(
        'INSERT INTO clientes (nombre, ruc, telefono, email, es_extranjero) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nombre, ruc, telefono, email, es_extranjero || false] // Usa el valor recibido o 'false' por defecto
    );
    return result.rows[0];
};
export const updateClienteById = async (id: number, data: any) => {
    const { nombre, ruc, telefono, email, es_extranjero } = data;
    const result = await pool.query(
        'UPDATE clientes SET nombre = $1, ruc = $2, telefono = $3, email = $4, es_extranjero = $5 WHERE id = $6 RETURNING *',
        [nombre, ruc, telefono, email, es_extranjero || false, id] // Usa el valor recibido o 'false' por defecto
    );
    if (result.rowCount === 0) throw new Error('Cliente no encontrado');
    return result.rows[0];
};

export const deleteClienteById = async (id: number) => {
    const ventasResult = await pool.query('SELECT id FROM ventas WHERE cliente_id = $1', [id]);
    if (ventasResult.rowCount) {
        throw new Error('No se puede eliminar un cliente con historial de ventas.');
    }

    const deleteResult = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    if (deleteResult.rowCount === 0) {
        throw new Error('Cliente no encontrado');
    }
    return { success: true };
};

export const getClienteDetailsById = async (id: number) => {
    const rates = await getExchangeRates();
    if (!rates) {
        throw new Error("Las tasas de cambio no están disponibles.");
    }

    const query = `
        SELECT
            c.id, c.nombre, c.es_extranjero, c.ruc, c.telefono, c.email, c.fecha_registro,
            
            COALESCE((
                SELECT SUM(
                    CASE
                        WHEN moneda = 'USD' THEN total
                        WHEN moneda = 'PYG' THEN total / ${rates.PYG}
                        WHEN moneda = 'BRL' THEN total / ${rates.BRL}
                        ELSE 0
                    END
                ) 
                FROM ventas 
                WHERE cliente_id = c.id
            ), 0) AS gasto_total_usd_normalizado,
            
            COALESCE(
                (SELECT json_agg(ventas_con_items)
                 FROM (
                    SELECT
                        v.id, v.fecha_venta, v.total, v.moneda,
                        (SELECT json_agg(
                            json_build_object(
                                'producto_nombre', p.nombre,
                                'cantidad', vi.cantidad,
                                'precio_unitario', vi.precio_unitario
                            )
                        ) FROM venta_items vi JOIN productos p ON vi.producto_id = p.id WHERE vi.venta_id = v.id) as items
                    FROM ventas v
                    WHERE v.cliente_id = c.id
                    ORDER BY v.fecha_venta DESC
                 ) AS ventas_con_items
                ), '[]'::json
            ) AS historial_compras
        FROM
            clientes c
        WHERE
            c.id = $1
        GROUP BY c.id;
    `;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
        throw new Error('Cliente no encontrado');
    }

    const clienteData = result.rows[0];
    const gastoTotalUSD = parseFloat(clienteData.gasto_total_usd_normalizado);

    const finalResult = {
        ...clienteData,
        gasto_total_usd: gastoTotalUSD.toFixed(2),
        gasto_total_pyg: (gastoTotalUSD * rates.PYG).toFixed(0),
        gasto_total_brl: (gastoTotalUSD * rates.BRL).toFixed(2),
    };
    delete finalResult.gasto_total_usd_normalizado;

    return finalResult;
};