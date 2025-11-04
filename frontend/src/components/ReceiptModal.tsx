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
import { useReactToPrint } from 'react-to-print';
import logo from '../assets/logo.png';

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
    const printRef = useRef(null);

    // Configuración profesional de react-to-print (igual que CheckoutModal)
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Venta-${venta?.id || 'comprobante'}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 15mm;
            }
            @media print {
                body {
                    font-family: 'Arial', sans-serif;
                    color: #000 !important;
                    background: white !important;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .MuiTableContainer-root {
                    box-shadow: none !important;
                }
                .MuiTable-root {
                    border-collapse: collapse !important;
                }
                .MuiTableCell-root {
                    border: 1px solid #000 !important;
                    padding: 8px !important;
                    color: #000 !important;
                    background: white !important;
                }
                .MuiTableHead-root .MuiTableCell-root {
                    background: #f5f5f5 !important;
                    font-weight: bold !important;
                }
                .MuiTypography-root {
                    color: #000 !important;
                }
                .MuiDivider-root {
                    border-color: #000 !important;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .receipt-details {
                    margin-bottom: 15px;
                }
                .receipt-totals {
                    margin-top: 15px;
                    border-top: 2px solid #000;
                    padding-top: 10px;
                }
            }
        `,
        onBeforePrint: () => {
            console.log('Preparando impresión del comprobante...');
            return Promise.resolve();
        },
        onAfterPrint: () => {
            console.log('Impresión completada exitosamente');
        }
    });

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
                <Box ref={printRef} sx={{ p: 2 }}>
                    <Box className="receipt-header">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <img 
                                src={logo} 
                                alt="Logo" 
                                style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    marginRight: '16px' 
                                }} 
                            />
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4d156bff' }}>
                                    VINOVAULT
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Sistema de Gestión de Inventario
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box className="receipt-details">
                        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    COMPROBANTE DE VENTA
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Comprobante #:</strong> {venta?.id}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Fecha:</strong> {venta ? new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2">
                                    <strong>Cliente:</strong> {venta?.cliente_nombre}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Vendedor:</strong> {venta?.usuario_nombre}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Almacén:</strong> {venta?.almacen_nombre}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Producto</strong></TableCell>
                                    <TableCell align="center"><strong>Cantidad</strong></TableCell>
                                    <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                                    <TableCell align="right"><strong>Total</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {venta?.items?.map((item: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.nombre_producto}</TableCell>
                                        <TableCell align="center">{item.cantidad}</TableCell>
                                        <TableCell align="right">
                                            ${(Number(item.precio_unitario) || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            ${((Number(item.precio_unitario) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box className="receipt-totals" sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Box sx={{ minWidth: '300px' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Subtotal:</Typography>
                                    <Typography variant="body2">
                                        ${venta ? (Number(venta.subtotal) || 0).toFixed(2) : '0.00'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Impuestos:</Typography>
                                    <Typography variant="body2">
                                        ${venta ? (Number(venta.impuestos) || 0).toFixed(2) : '0.00'}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        TOTAL:
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        ${venta ? (Number(venta.total) || 0).toFixed(2) : '0.00'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 4, pt: 2, borderTop: '1px dashed #ccc' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            ¡Gracias por su compra!
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            VINOVAULT - Sistema de Gestión de Inventario
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                            Impreso el: {new Date().toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant="outlined" onClick={onClose}>
                    Cerrar
                </Button>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    color="primary"
                >
                    Imprimir Comprobante
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptModal;