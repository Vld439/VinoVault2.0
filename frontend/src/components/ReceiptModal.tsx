import React, { useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import logo from '../assets/logo.png';
import { usePrintReceipt } from '../hooks/usePrintReceipt';

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

interface ReceiptModalProps {
    open: boolean;
    venta: Venta | null;
    onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, venta, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const { handlePrint } = usePrintReceipt();

    const handleButtonClick = () => {
        if (!venta) {
            console.error('❌ No hay datos de venta para imprimir');
            return;
        }
        
        // Convertir datos de venta al formato esperado por el hook
        const printData = {
            ventaId: venta.id,
            fecha: new Date(venta.fecha_venta),
            clientName: venta.cliente_nombre,
            vendedor: venta.usuario_nombre,
            almacenName: venta.almacen_nombre,
            items: venta.items.map(item => ({
                nombre: item.nombre_producto,
                quantity: item.cantidad,
                precio_venta: item.precio_unitario,
                precio_venta_pyg: item.precio_unitario,
                precio_venta_brl: item.precio_unitario
            })),
            subtotal: parseFloat(venta.subtotal),
            impuesto: parseFloat(venta.impuestos),
            total: parseFloat(venta.total)
        };
        
        handlePrint(printData);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PrintIcon />
                    <Typography variant="h6">Comprobante de Venta</Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box ref={printRef} sx={{ 
                    bgcolor: 'white', 
                    color: 'black',
                    p: 3,
                    fontSize: '0.9rem'
                }}>
                    {/* Header compacto */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img 
                            src={logo} 
                            alt="Logo VinoVault" 
                            style={{ height: '50px', maxWidth: '150px', marginBottom: '8px' }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                            COMPROBANTE DE VENTA
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            VinoVault - Sistema de Gestión
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: '#1976d2' }} />

                    {/* Detalles en formato compacto */}
                    <Box sx={{ mb: 2, fontSize: '0.9rem' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'black' }}>
                                    <strong>N° Venta:</strong> #{venta?.id}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'black' }}>
                                    <strong>Fecha:</strong> {venta ? new Date(venta.fecha_venta).toLocaleDateString('es-ES') : 'N/A'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'black' }}>
                                    <strong>Cliente:</strong> {venta?.cliente_nombre}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'black' }}>
                                    <strong>Vendedor:</strong> {venta?.usuario_nombre}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'black' }}>
                                    <strong>Almacén:</strong> {venta?.almacen_nombre}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    
                    {/* Tabla más compacta */}
                    <TableContainer component={Paper} elevation={1} sx={{ my: 2, border: '1px solid #ddd' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>Producto</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>Cant.</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>Precio</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>Subtotal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {venta?.items.map((item, index) => (
                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                        <TableCell sx={{ fontSize: '0.85rem', py: 1, color: 'black' }}>{item.nombre_producto}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: '0.85rem', py: 1, color: 'black' }}>{item.cantidad}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.85rem', py: 1, color: 'black' }}>
                                            ${parseFloat(item.precio_unitario).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1, color: 'black' }}>
                                            ${(parseFloat(item.precio_unitario) * item.cantidad).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    {/* Totales más compactos */}
                    <Box sx={{ 
                        mt: 2, 
                        pt: 1.5, 
                        borderTop: '2px solid #1976d2',
                        textAlign: 'right'
                    }}>
                        <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500, color: 'black' }}>
                            Subtotal: ${venta ? parseFloat(venta.subtotal).toFixed(2) : '0.00'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500, color: 'black' }}>
                            IVA (10%): ${venta ? parseFloat(venta.impuestos).toFixed(2) : '0.00'}
                        </Typography>
                        <Typography variant="h5" sx={{ 
                            fontWeight: 'bold', 
                            color: 'white',
                            bgcolor: '#1976d2',
                            p: 1,
                            borderRadius: 1,
                            display: 'inline-block',
                            minWidth: '200px'
                        }}>
                            TOTAL: ${venta ? parseFloat(venta.total).toFixed(2) : '0.00'}
                        </Typography>
                    </Box>

                    {/* Footer compacto */}
                    <Box sx={{ 
                        mt: 2, 
                        pt: 1.5, 
                        borderTop: '1px solid #ddd',
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
                            ¡Gracias por su compra!
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                            {new Date().toLocaleString('es-ES')}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
                <Button
                    onClick={handleButtonClick}
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                >
                    Imprimir
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptModal;