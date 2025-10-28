// src/pages/PerfilCliente.tsx
import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Paper, CircularProgress, Alert, Button, Divider } from '@mui/material';
import { useAuth, axiosInstance } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';

// Interfaces para la data que esperamos
interface VentaItem {
    producto_nombre: string;
    cantidad: number;
    precio_unitario: string;
}
interface Venta {
    id: number;
    fecha_venta: string;
    total: string;
    moneda: 'USD' | 'PYG' | 'BRL';
    items: VentaItem[];
}
interface ClienteDetails {
    nombre: string;
    email: string;
    telefono: string;
    fecha_registro: string;
    gasto_total_usd: string;
    gasto_total_pyg: string;
    gasto_total_brl: string;
    historial_compras: Venta[];
}

const PerfilClientePage = () => {
    const { id } = useParams<{ id: string }>();
    const { showNotification } = useAuth();
    const [cliente, setCliente] = useState<ClienteDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            axiosInstance.get(`/clientes/${id}/detalles`)
                .then(res => setCliente(res.data))
                .catch(() => showNotification('No se pudieron cargar los detalles del cliente.', 'error'))
                .finally(() => setIsLoading(false));
        }
    }, [id, showNotification]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    }
    if (!cliente) {
        return <Alert severity="error">Cliente no encontrado.</Alert>;
    }

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">{cliente.nombre}</Typography>
                <Button component={RouterLink} to="/clientes" variant="outlined">Volver a la Lista</Button>
            </Box>

            {/* --- LAYOUT CORREGIDO CON BOX --- */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
                {/* Columna Izquierda */}
                <Box sx={{ width: { xs: '100%', md: '33.33%' }, px: 1.5 }}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Información de Contacto</Typography>
                        <Typography variant="body1"><strong>Email:</strong> {cliente.email || 'N/A'}</Typography>
                        <Typography variant="body1"><strong>Teléfono:</strong> {cliente.telefono || 'N/A'}</Typography>
                        <Typography variant="body1"><strong>Cliente desde:</strong> {formatDate(cliente.fecha_registro)}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Resumen Financiero</Typography>
                        <Typography variant="body1"><strong>Gasto Total (USD):</strong> {formatCurrency(cliente.gasto_total_usd, 'USD')}</Typography>
                        <Typography variant="body1"><strong>Gasto Total (PYG):</strong> {formatCurrency(cliente.gasto_total_pyg, 'PYG')}</Typography>
                        <Typography variant="body1"><strong>Gasto Total (BRL):</strong> {formatCurrency(cliente.gasto_total_brl, 'BRL')}</Typography>
                    </Paper>
                </Box>
                
                {/* Columna Derecha */}
                <Box sx={{ width: { xs: '100%', md: '66.67%' }, px: 1.5, mt: { xs: 3, md: 0 } }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Historial de Compras</Typography>
                        {cliente.historial_compras.length > 0 ? cliente.historial_compras.map(venta => (
                            <Box key={venta.id} sx={{ mb: 2 }}>
                                <Typography variant="subtitle1"><strong>Venta #{venta.id}</strong> - {formatDate(venta.fecha_venta)} - <strong>Total: {formatCurrency(venta.total, venta.moneda)}</strong></Typography>
                                <ul>
                                    {venta.items.map((item, index) => (
                                        <li key={`${item.producto_nombre}-${index}`}>
                                            <Typography variant="body2">{item.cantidad} x {item.producto_nombre}</Typography>
                                        </li>
                                    ))}
                                </ul>
                                <Divider />
                            </Box>
                        )) : (
                            <Typography>Este cliente aún no ha realizado compras.</Typography>
                        )}
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
};

export default PerfilClientePage;