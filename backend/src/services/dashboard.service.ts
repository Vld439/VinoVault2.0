import { Pool } from 'pg';
import { getExchangeRates } from './exchangeRate.service.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const getDashboardStats = async () => {
    const client = await pool.connect();
    try {
        const rates = await getExchangeRates();
        if (!rates) {
            throw new Error("Las tasas de cambio no están disponibles.");
        }

        const inventoryValueQuery = `
            SELECT COALESCE(SUM(p.precio_compra * i.cantidad), 0) AS total_value
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id;
        `;

        const salesTodayQuery = `
            SELECT COALESCE(SUM(
                CASE
                    WHEN moneda = 'USD' THEN total
                    WHEN moneda = 'PYG' THEN total / ${rates.PYG}
                    WHEN moneda = 'BRL' THEN total / ${rates.BRL}
                    ELSE 0
                END
            ), 0) AS total_sales_in_usd
            FROM ventas
            WHERE fecha_venta >= CURRENT_DATE;
        `;

        const productCountQuery = `SELECT COUNT(*) AS count FROM productos;`;
        const clientCountQuery = `SELECT COUNT(*) AS count FROM clientes;`;

        const [
            inventoryValueRes,
            salesTodayRes,
            productCountRes,
            clientCountRes
        ] = await Promise.all([
            client.query(inventoryValueQuery),
            client.query(salesTodayQuery),
            client.query(productCountQuery),
            client.query(clientCountQuery),
        ]);

        const valorInventarioUSD = parseFloat(inventoryValueRes.rows[0].total_value);
        const ventasHoyUSD = parseFloat(salesTodayRes.rows[0].total_sales_in_usd);

        const stats = {
            valorInventario: {
                usd: valorInventarioUSD.toFixed(2),
                pyg: (valorInventarioUSD * rates.PYG).toFixed(0),
                brl: (valorInventarioUSD * rates.BRL).toFixed(2),
            },
            ventasHoy: {
                usd: ventasHoyUSD.toFixed(2),
                pyg: (ventasHoyUSD * rates.PYG).toFixed(0),
                brl: (ventasHoyUSD * rates.BRL).toFixed(2),
            },
            totalProductos: productCountRes.rows[0].count,
            totalClientes: clientCountRes.rows[0].count,
        };

        return stats;

    } catch (error) {
        console.error("Error al calcular las estadísticas del dashboard:", error);
        throw new Error('Error al calcular las estadísticas.');
    } finally {
        client.release();
    }
};