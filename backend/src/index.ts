import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importación de todas las rutas
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

// Convertimos el PORT a número para que TypeScript y Express no tengan problemas.
const PORT = parseInt(process.env.PORT || '5001');

// Configuración de CORS (luego añadimos la URL de Vercel)
const corsOptions = {
  origin: ['http://localhost:5173', 'https://vino-vault-2-0.vercel.app'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());

// Servidor de archivos estáticos para las imágenes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conexión a la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/almacenes', almacenRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta de diagnóstico
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

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de VinoVault corriendo en el puerto ${PORT}`);
});

//Servidor de VinoVault en Vercel