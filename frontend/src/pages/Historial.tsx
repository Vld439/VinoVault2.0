import { useEffect, useState } from 'react';
import {
    Container, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box, Button, Chip, IconButton, ToggleButton, ToggleButtonGroup,
    useTheme, useMediaQuery, Card, CardContent, CardActions, Stack, Divider, Icon, Fab
} from '@mui/material';
import { Print as PrintIcon, Inventory as InventoryIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import '../assets/print-mobile.css';
import { axiosInstance, useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatCurrency';
import { useCart } from '../context/CartContext';
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
    moneda: string;
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
    // Para responsive
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Determine the primary brand color based on the theme mode
    const brandColor = theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.primary.main;

    const [historialVentas, setHistorialVentas] = useState<Venta[]>([]);
    const [movimientosStock, setMovimientosStock] = useState<MovimientoStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [vistaActual, setVistaActual] = useState<'ventas' | 'movimientos'>('ventas');
    const { showNotification } = useAuth();
    const { currency } = useCart();

    const [exchangeRates, setExchangeRates] = useState<{ PYG: number, BRL: number } | null>(null);

    // Cargar tasas de cambio
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await axiosInstance.get('/dashboard/exchange-rates');
                setExchangeRates(response.data);
            } catch (error) {
                console.warn('Error cargando tasas:', error);
                setExchangeRates({ PYG: 7500, BRL: 5 }); // Fallback
            }
        };
        fetchRates();
    }, []);

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

    const handleGenerarReporte = () => {
        // Función simple de impresión para móviles
        window.print();
    };

    // Card para venta individual en móvil
    const VentaCard = ({ venta }: { venta: Venta }) => (
        <Card sx={{ mb: 2, elevation: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        Venta #{venta.id.toString().padStart(6, '0')}
                    </Typography>
                    <Chip
                        label="Completada"
                        color="success"
                        size="small"
                        variant="filled"
                    />
                </Box>

                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>schedule</Icon>
                        <Typography variant="body2" color="text.secondary">
                            {format(new Date(venta.fecha_venta), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>person</Icon>
                        <Typography variant="body2" color="text.secondary">
                            Cliente: {venta.cliente_nombre}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>badge</Icon>
                        <Typography variant="body2" color="text.secondary">
                            Vendedor: {venta.usuario_nombre}
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            {(() => {
                                const totalUSD = Number(venta.total);
                                const rates = exchangeRates || { PYG: 7500, BRL: 5 };
                                let converted = totalUSD;
                                if (currency === 'PYG') converted = totalUSD * rates.PYG;
                                if (currency === 'BRL') converted = totalUSD * rates.BRL;
                                return formatCurrency(converted, currency);
                            })()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>

            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={() => handlePrintReceipt(venta)}
                    size="small"
                >
                    Imprimir Comprobante
                </Button>
            </CardActions>
        </Card>
    );

    // Card para movimiento de stock en móvil
    const MovimientoCard = ({ movimiento }: { movimiento: MovimientoStock }) => (
        <Card sx={{ mb: 2, elevation: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        #{movimiento.id}
                    </Typography>
                    <Chip
                        label={movimiento.tipo_movimiento}
                        color={movimiento.cantidad > 0 ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                    />
                </Box>

                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>schedule</Icon>
                        <Typography variant="body2" color="text.secondary">
                            {format(new Date(movimiento.fecha_movimiento), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>inventory</Icon>
                        <Typography variant="body2" color="text.secondary">
                            {movimiento.producto_nombre}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>warehouse</Icon>
                        <Typography variant="body2" color="text.secondary">
                            Almacén: {movimiento.almacen_nombre}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color="action" sx={{ fontSize: '1.2rem' }}>person</Icon>
                        <Typography variant="body2" color="text.secondary">
                            Usuario: {movimiento.usuario_nombre}
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography
                            variant="h5"
                            color={movimiento.cantidad > 0 ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 'bold' }}
                        >
                            {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="xl">
            <Box sx={{
                my: { xs: 2, md: 4 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 }
            }}>
                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    component="h1"
                    sx={{ textAlign: { xs: 'center', sm: 'left' } }}
                >
                    {vistaActual === 'ventas' ? 'Historial de Ventas' : 'Movimientos de Stock'}
                </Typography>
                <Button
                    component={RouterLink}
                    to="/dashboard"
                    variant="outlined"
                    startIcon={<Icon>dashboard</Icon>}
                    fullWidth={isMobile}
                >
                    Volver al Dashboard
                </Button>
            </Box>

            {/* Botones para alternar entre vistas */}
            <Box className="no-print" sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                    value={vistaActual}
                    exclusive
                    onChange={(_, newView) => {
                        if (newView !== null) {
                            setVistaActual(newView);
                        }
                    }}
                    aria-label="Vista del historial"
                    size={isMobile ? "small" : "medium"}
                    orientation={isMobile ? "vertical" : "horizontal"}
                >
                    <ToggleButton value="ventas" aria-label="Historial de ventas">
                        <ReceiptIcon sx={{ mr: isMobile ? 0 : 1, mb: isMobile ? 1 : 0 }} />
                        {isMobile ? 'Ventas' : 'Historial de Ventas'}
                    </ToggleButton>
                    <ToggleButton value="movimientos" aria-label="Movimientos de stock">
                        <InventoryIcon sx={{ mr: isMobile ? 0 : 1, mb: isMobile ? 1 : 0 }} />
                        {isMobile ? 'Stock' : 'Movimientos de Stock'}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {isLoading ? (
                <Box className="no-print" sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Vista móvil con cards */}
                    {isMobile ? (
                        <div data-print="true" style={{ padding: '16px', backgroundColor: 'white', color: '#000' }}>
                            {/* Header para impresión móvil */}
                            <Box sx={{ mb: 3, textAlign: 'center', borderBottom: '2px solid #000', pb: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: brandColor }}>
                                    VinoVault
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                                    {vistaActual === 'ventas' ? 'HISTORIAL DE VENTAS' : 'MOVIMIENTOS DE STOCK'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                                    Generado: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </Typography>
                            </Box>

                            <Box>
                                {vistaActual === 'ventas' ? (
                                    historialVentas.length > 0 ? (
                                        historialVentas.map((venta) => (
                                            <VentaCard key={venta.id} venta={venta} />
                                        ))
                                    ) : (
                                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                                            <Icon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}>receipt_long</Icon>
                                            <Typography variant="h6" color="text.secondary">
                                                No hay ventas registradas
                                            </Typography>
                                        </Paper>
                                    )
                                ) : (
                                    movimientosStock.length > 0 ? (
                                        movimientosStock.map((movimiento) => (
                                            <MovimientoCard key={movimiento.id} movimiento={movimiento} />
                                        ))
                                    ) : (
                                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                                            <Icon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}>inventory</Icon>
                                            <Typography variant="h6" color="text.secondary">
                                                No hay movimientos registrados
                                            </Typography>
                                        </Paper>
                                    )
                                )}
                            </Box>
                        </div>
                    ) : (
                        // Vista desktop con tabla
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
                                                    {(() => {
                                                        const totalUSD = Number(venta.total);
                                                        const rates = exchangeRates || { PYG: 7500, BRL: 5 };
                                                        let converted = totalUSD;
                                                        if (currency === 'PYG') converted = totalUSD * rates.PYG;
                                                        if (currency === 'BRL') converted = totalUSD * rates.BRL;
                                                        return formatCurrency(converted, currency);
                                                    })()}
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
                </>
            )}

            <ReceiptModal
                open={isReceiptModalOpen}
                venta={selectedVenta}
                onClose={handleCloseReceiptModal}
            />

            {/* Botón flotante para generar reporte en móvil */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="generar reporte"
                    onClick={handleGenerarReporte}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 1000,
                    }}
                    className="no-print"
                >
                    <PrintIcon />
                </Fab>
            )}
        </Container>
    );
};

export default HistorialPage;