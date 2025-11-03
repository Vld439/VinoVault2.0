import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/productos.routes.js';
import userRoutes from './routes/user.routes.js';
import almacenRoutes from './routes/almacenes.routes.js';
import inventarioRoutes from './routes/inventario.routes.js';
import clienteRoutes from './routes/clientes.routes.js';
import ventaRoutes from './routes/ventas.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportesRoutes from './routes/reportes.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/almacenes', almacenRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);

app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const time = await pool.query('SELECT NOW()');
        res.status(200).json({
            status: 'OK',
            message: 'Servidor funcionando y conectado a la base de datos.',
            dbTime: time.rows[0].now,
        });
    } catch (e) {
        res.status(500).json({
            status: 'Error',
            message: 'No se pudo conectar a la base de datos.',
            error: (e as Error).message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de VinoVault corriendo en http://localhost:${PORT}`);
});