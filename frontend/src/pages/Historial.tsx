import { useEffect, useState } from 'react';
import {
    Container, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box, Button
} from '@mui/material';
import { axiosInstance, useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

interface Movimiento {
    id: number;
    producto_nombre: string;
    almacen_nombre: string;
    cantidad: number;
    tipo_movimiento: string;
    usuario_nombre: string;
    fecha_movimiento: string; // <-- Asegúrate que coincida con el nombre de la columna
}

const HistorialPage = () => {
    const [historial, setHistorial] = useState<Movimiento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useAuth();

    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                const response = await axiosInstance.get('/inventario/historial');
                setHistorial(response.data);
            } catch (error) {
                showNotification('No se pudo cargar el historial.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistorial();
    }, []);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Historial de Movimientos de Stock
                </Typography>
                <Button component={RouterLink} to="/dashboard" variant="outlined">
                    Volver al Dashboard
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Almacén</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Realizado por</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historial.map((mov) => (
                                <TableRow key={mov.id} hover>
                                    <TableCell>{formatDate(mov.fecha_movimiento)}</TableCell>
                                    <TableCell>{mov.producto_nombre}</TableCell>
                                    <TableCell>{mov.almacen_nombre}</TableCell>
                                    <TableCell>{mov.tipo_movimiento}</TableCell>
                                    <TableCell align="right" sx={{ color: mov.cantidad > 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                        {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                                    </TableCell>
                                    <TableCell>{mov.usuario_nombre}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default HistorialPage;