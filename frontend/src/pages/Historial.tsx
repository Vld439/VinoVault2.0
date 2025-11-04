import { useEffect, useState } from 'react';
import {
    Container, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box, Button, Chip, IconButton, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Print as PrintIcon, Inventory as InventoryIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { axiosInstance, useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReceiptModal from '../components/ReceiptModal';

interface VentaItem {
    nombre_producto: string;
    cantidad: number;
    precio_unitario: string;
}

interface Venta {
    id: number;
    fecha_venta: string;
    cliente_nombre: string;
    usuario_nombre: string;
    almacen_nombre: string;
    subtotal: string;
    impuestos: string;
    total: string;
    items: VentaItem[];
}

interface MovimientoStock {
    id: number;
    fecha_movimiento: string;
    producto_nombre: string;
    almacen_nombre: string;
    cantidad: number;
    tipo_movimiento: string;
    usuario_nombre: string;
}

const HistorialPage = () => {
    const [historialVentas, setHistorialVentas] = useState<Venta[]>([]);
    const [movimientosStock, setMovimientosStock] = useState<MovimientoStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [vistaActual, setVistaActual] = useState<'ventas' | 'movimientos'>('ventas');
    const { showNotification } = useAuth();

    useEffect(() => {
        fetchData();
    }, [vistaActual]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (vistaActual === 'ventas') {
                const response = await axiosInstance.get('/ventas/historial');
                setHistorialVentas(response.data);
            } else {
                const response = await axiosInstance.get('/inventario/historial');
                setMovimientosStock(response.data);
            }
        } catch (error) {
            showNotification(`No se pudo cargar el historial de ${vistaActual === 'ventas' ? 'ventas' : 'movimientos'}.`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintReceipt = (venta: Venta) => {
        setSelectedVenta(venta);
        setIsReceiptModalOpen(true);
    };

    const handleCloseReceiptModal = () => {
        setIsReceiptModalOpen(false);
        setSelectedVenta(null);
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    {vistaActual === 'ventas' ? 'Historial de Ventas' : 'Movimientos de Stock'}
                </Typography>
                <Button component={RouterLink} to="/dashboard" variant="outlined">
                    Volver al Dashboard
                </Button>
            </Box>

            {/* Botones para alternar entre vistas */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                    value={vistaActual}
                    exclusive
                    onChange={(_, newView) => {
                        if (newView !== null) {
                            setVistaActual(newView);
                        }
                    }}
                    aria-label="Vista del historial"
                >
                    <ToggleButton value="ventas" aria-label="Historial de ventas">
                        <ReceiptIcon sx={{ mr: 1 }} />
                        Historial de Ventas
                    </ToggleButton>
                    <ToggleButton value="movimientos" aria-label="Movimientos de stock">
                        <InventoryIcon sx={{ mr: 1 }} />
                        Movimientos de Stock
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {vistaActual === 'ventas' ? (
                                    <>
                                        <TableCell sx={{ fontWeight: 'bold' }}>ID Venta</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Vendedor</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Almacén</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Cantidad</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                                    </>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vistaActual === 'ventas' ? (
                                historialVentas.map((venta) => (
                                    <TableRow key={venta.id} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>#{venta.id.toString().padStart(6, '0')}</TableCell>
                                        <TableCell>
                                            {format(new Date(venta.fecha_venta), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </TableCell>
                                        <TableCell>{venta.cliente_nombre}</TableCell>
                                        <TableCell>{venta.usuario_nombre}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label="Completada"
                                                size="small"
                                                color="success"
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            ${Number(venta.total).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                onClick={() => handlePrintReceipt(venta)}
                                                color="primary"
                                                title="Imprimir comprobante"
                                                size="small"
                                            >
                                                <PrintIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                movimientosStock.map((movimiento) => (
                                    <TableRow key={movimiento.id} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>#{movimiento.id}</TableCell>
                                        <TableCell>
                                            {format(new Date(movimiento.fecha_movimiento), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </TableCell>
                                        <TableCell>{movimiento.producto_nombre}</TableCell>
                                        <TableCell>{movimiento.almacen_nombre}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={movimiento.tipo_movimiento}
                                                size="small"
                                                color={movimiento.cantidad > 0 ? 'success' : 'error'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography 
                                                color={movimiento.cantidad > 0 ? 'success.main' : 'error.main'}
                                                sx={{ fontWeight: 'bold' }}
                                            >
                                                {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{movimiento.usuario_nombre}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ReceiptModal
                open={isReceiptModalOpen}
                venta={selectedVenta}
                onClose={handleCloseReceiptModal}
            />
        </Container>
    );
};

export default HistorialPage;