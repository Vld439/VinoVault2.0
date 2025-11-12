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
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PrintIcon color="primary" />
                    <Typography variant="h6">Comprobante de Venta</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box ref={printRef} className="receipt-print" sx={{ p: 2 }}>
                    <Box className="receipt-header">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <img 
                                src={logo} 
                                alt="Logo VinoVault" 
                                style={{ height: '80px', maxWidth: '200px' }}
                            />
                        </Box>
                        <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
                            COMPROBANTE DE VENTA
                        </Typography>
                        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 2 }}>
                            VinoVault - Sistema de Gestión
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box className="receipt-details" sx={{ mb: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                            <Box>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>N° Venta:</strong> #{venta?.id}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Fecha:</strong> {venta ? new Date(venta.fecha_venta).toLocaleString('es-ES') : 'N/A'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Cliente:</strong> {venta?.cliente_nombre}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Vendedor:</strong> {venta?.usuario_nombre}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Almacén:</strong> {venta?.almacen_nombre}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    
                    <TableContainer component={Paper} elevation={2} sx={{ my: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio Unitario</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {venta?.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.nombre_producto}</TableCell>
                                        <TableCell align="center">{item.cantidad}</TableCell>
                                        <TableCell align="right">${parseFloat(item.precio_unitario).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            ${(parseFloat(item.precio_unitario) * item.cantidad).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    <Box className="receipt-totals" sx={{ 
                        mt: 3, 
                        pt: 2, 
                        borderTop: '2px solid #ddd',
                        textAlign: 'right'
                    }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            <strong>Subtotal: ${venta ? parseFloat(venta.subtotal).toFixed(2) : '0.00'}</strong>
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            <strong>IVA (10%): ${venta ? parseFloat(venta.impuestos).toFixed(2) : '0.00'}</strong>
                        </Typography>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 'bold', 
                            color: 'primary.main',
                            mt: 2,
                            p: 1,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1
                        }}>
                            TOTAL: ${venta ? parseFloat(venta.total).toFixed(2) : '0.00'}
                        </Typography>
                    </Box>

                    <Box sx={{ 
                        mt: 4, 
                        pt: 2, 
                        borderTop: '1px solid #ddd',
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            Gracias por su compra - Vino Vault
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Fecha de impresión: {new Date().toLocaleString('es-ES')}
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