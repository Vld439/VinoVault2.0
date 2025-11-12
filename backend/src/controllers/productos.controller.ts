import { Request, Response } from 'express';
import { Pool } from 'pg';
import { deleteProductById, removeImageFromProduct, updateProductById } from '../services/productos.service.js';
import { getExchangeRates } from '../services/exchangeRate.service.js';
import { uploadToSupabase, deleteFromSupabase } from '../middleware/supabaseUpload.middleware.js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT p.*, COALESCE(SUM(i.cantidad), 0)::integer AS total_stock
            FROM productos p
            LEFT JOIN inventario i ON p.id = i.producto_id
            GROUP BY p.id
            ORDER BY p.nombre ASC;
        `;
        const result = await pool.query(query);

        const rates = await getExchangeRates();
        if (!rates) {
          throw new Error("Las tasas de cambio no están disponibles.");
        }

        const productsWithConvertedPrices = result.rows.map(product => {
            const precioVentaUSD = parseFloat(product.precio_venta);
            return {
                ...product,
                precio_venta_pyg: (precioVentaUSD * rates.PYG).toFixed(0),
                precio_venta_brl: (precioVentaUSD * rates.BRL).toFixed(2)
            };
        });

        res.status(200).json(productsWithConvertedPrices);
    } catch (error) {
        console.error("Error al obtener productos con stock:", error);
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT
                p.id, p.sku, p.nombre, p.descripcion, p.precio_compra, p.precio_venta, p.imagen_url,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'almacen_id', a.id,
                            'almacen_nombre', a.nombre,
                            'cantidad', COALESCE(i.cantidad, 0)
                        ) ORDER BY a.nombre
                    ), '[]'::json
                ) AS inventario
            FROM productos p
            CROSS JOIN almacenes a
            LEFT JOIN inventario i ON a.id = i.almacen_id AND i.producto_id = p.id
            WHERE p.id = $1
            GROUP BY p.id;
        `;
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
  const { sku, nombre, descripcion, precio_compra, precio_venta, stock_inicial, almacen_id } = req.body;
  
  // Subir imagen a Supabase Storage si existe
  let imagen_url = null;
  if (req.file) {
    try {
      imagen_url = await uploadToSupabase(req.file, 'productos');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      return res.status(500).json({ message: 'Error subiendo imagen a Supabase' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productResult = await client.query(
      'INSERT INTO productos (sku, nombre, descripcion, precio_compra, precio_venta, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [sku, nombre, descripcion, precio_compra, precio_venta, imagen_url]
    );
    const newProduct = productResult.rows[0];

    if (stock_inicial && almacen_id && Number(stock_inicial) > 0) {
      await client.query(
        'INSERT INTO inventario (producto_id, almacen_id, cantidad) VALUES ($1, $2, $3)',
        [newProduct.id, almacen_id, stock_inicial]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newProduct);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en la transacción de creación de producto:", error);
    res.status(500).json({ message: 'Error al crear el producto' });
  } finally {
    client.release();
  }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedProduct = await updateProductById(Number(id), req.body);
        res.status(200).json(updatedProduct);
    } catch (error) {
        if ((error as Error).message === 'Producto no encontrado') {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await deleteProductById(Number(id));
        res.status(204).send();
    } catch (error) {
        if ((error as Error).message === 'Producto no encontrado') {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};

export const updateProductImage = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen.' });
  }

  try {
    // Obtener la imagen anterior para eliminarla de Supabase
    const currentProduct = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
    const oldImageUrl = currentProduct.rows[0]?.imagen_url;
    
    // Subir nueva imagen a Supabase
    const imagen_url = await uploadToSupabase(req.file, 'productos');
    
    // Actualizar base de datos
    const result = await pool.query(
      'UPDATE productos SET imagen_url = $1 WHERE id = $2 RETURNING *',
      [imagen_url, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Eliminar imagen anterior de Supabase (si existe)
    if (oldImageUrl && oldImageUrl.includes('supabase')) {
      await deleteFromSupabase(oldImageUrl);
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la imagen del producto' });
  }
};

export const removeProductImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedProduct = await removeImageFromProduct(Number(id));
        res.status(200).json(updatedProduct);
    } catch (error) {
        if ((error as Error).message === 'Producto no encontrado') {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(500).json({ message: 'Error al eliminar la imagen del producto' });
    }
};