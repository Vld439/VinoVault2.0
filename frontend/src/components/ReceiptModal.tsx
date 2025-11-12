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
// import { useReactToPrint } from 'react-to-print';
import logo from '../assets/logo.png';
import '../assets/receipt-print.css';

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

    const handleButtonClick = () => {
        if (!venta) {
            console.error('❌ No hay datos de venta para imprimir');
            return;
        }
        handlePrint();
    };

    const handlePrint = () => {
        // Verificar si estamos en móvil
        const isMobile = window.innerWidth <= 768;
        
        // Debug para móvil
        if (isMobile) {
            alert(`📱 MODO MÓVIL - Ancho: ${window.innerWidth}px`);
        } else {
            alert(`💻 MODO DESKTOP - Ancho: ${window.innerWidth}px`);
        }
        
        if (isMobile) {
            // En móvil, usar el método simple de window.print() con CSS específico
            printMobileReceipt();
        } else {
            // En desktop, usar ventana nueva
            printDesktopReceipt();
        }
    };

    const printMobileReceipt = () => {
        alert('📱 Ejecutando printMobileReceipt');
        
        // Desactivar temporalmente el CSS de print-mobile.css
        const printMobileLinks = Array.from(document.querySelectorAll('link[href*="print-mobile.css"], style')).filter(el => 
            el.textContent?.includes('@media print') || (el as HTMLLinkElement).href?.includes('print-mobile.css')
        ) as HTMLElement[];
        
        alert(`🔗 CSS Links encontrados: ${printMobileLinks.length}`);
        
        printMobileLinks.forEach(link => {
            (link as any).disabled = true;
        });

        // Crear un elemento temporal específico para comprobante
        const printElement = document.createElement('div');
        printElement.style.position = 'fixed';
        printElement.style.left = '0';
        printElement.style.top = '0';
        printElement.style.width = '100vw';
        printElement.style.height = '100vh';
        printElement.style.background = 'white';
        printElement.style.color = 'black';
        printElement.style.fontFamily = 'Arial, sans-serif';
        printElement.style.padding = '20px';
        printElement.style.zIndex = '9999';
        printElement.style.overflow = 'auto';
        
        printElement.innerHTML = `
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #1976d2; margin: 0 0 10px 0; font-size: 24px;">VINOVAULT</h1>
                <p style="margin: 5px 0;">Sistema de Gestión de Inventario</p>
                <h2 style="margin: 15px 0;">COMPROBANTE DE VENTA</h2>
            </div>

            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Comprobante #:</strong>
                    <span>${venta?.id}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Fecha:</strong>
                    <span>${venta ? new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Cliente:</strong>
                    <span>${venta?.cliente_nombre || ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Vendedor:</strong>
                    <span>${venta?.usuario_nombre || ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Almacén:</strong>
                    <span>${venta?.almacen_nombre || ''}</span>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; background: #f0f0f0; font-weight: bold;">Producto</th>
                        <th style="border: 1px solid #000; padding: 8px; background: #f0f0f0; font-weight: bold;">Cant.</th>
                        <th style="border: 1px solid #000; padding: 8px; background: #f0f0f0; font-weight: bold; text-align: right;">Precio</th>
                        <th style="border: 1px solid #000; padding: 8px; background: #f0f0f0; font-weight: bold; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta?.items?.map(item => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">${item.nombre_producto}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${item.cantidad}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right;">$${(Number(item.precio_unitario) || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right;">$${((Number(item.precio_unitario) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center;">No hay items disponibles</td></tr>'}
                </tbody>
            </table>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #000;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Subtotal:</strong>
                    <span>$${venta ? (Number(venta.subtotal) || 0).toFixed(2) : '0.00'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Impuestos:</strong>
                    <span>$${venta ? (Number(venta.impuestos) || 0).toFixed(2) : '0.00'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000;">
                    <strong>TOTAL:</strong>
                    <strong>$${venta ? (Number(venta.total) || 0).toFixed(2) : '0.00'}</strong>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #000;">
                <p><strong>¡Gracias por su compra!</strong></p>
                <p>VINOVAULT - Sistema de Gestión</p>
                <p style="font-size: 0.9em;">Impreso: ${new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
        `;

        // Ocultar todo el contenido original
        const allElements = Array.from(document.body.children) as HTMLElement[];
        console.log('👥 Elementos del body:', allElements.length);
        
        allElements.forEach(el => {
            if (el !== printElement) {
                (el as any).originalDisplay = el.style.display;
                el.style.display = 'none';
            }
        });
        
        // Agregar al DOM
        document.body.appendChild(printElement);
        console.log('✅ Elemento de impresión agregado al DOM');

        // Imprimir
        alert('🖨️ A punto de llamar window.print()');
        window.print();

        // Limpiar después de imprimir
        setTimeout(() => {
            // Restaurar visibilidad de elementos originales
            allElements.forEach(el => {
                el.style.display = (el as any).originalDisplay || '';
            });
            
            // Restaurar CSS de print-mobile
            printMobileLinks.forEach(link => {
                (link as any).disabled = false;
            });
            
            // Remover elemento de impresión
            if (document.body.contains(printElement)) {
                document.body.removeChild(printElement);
            }
        }, 1000);
    };

    const printDesktopReceipt = () => {
        // Crear una nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Crear el contenido HTML completo para la impresión
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comprobante de Venta #${venta?.id}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        color: #000;
                        background: white;
                        margin: 0;
                        padding: 20px;
                        line-height: 1.4;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 15px;
                    }
                    .receipt-details {
                        margin-bottom: 20px;
                    }
                    .receipt-flex {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }
                    .receipt-column {
                        flex: 1;
                        margin-right: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background: #f5f5f5;
                        font-weight: bold;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .receipt-totals {
                        border-top: 2px solid #000;
                        padding-top: 15px;
                        margin-top: 20px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .total-final {
                        font-weight: bold;
                        font-size: 1.2em;
                        border-top: 1px solid #000;
                        padding-top: 10px;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px dashed #000;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <h1 style="color: #1976d2; margin: 0;">VINOVAULT</h1>
                    <p style="margin: 5px 0;">Sistema de Gestión de Inventario</p>
                    <h2 style="margin: 15px 0;">COMPROBANTE DE VENTA</h2>
                </div>

                <div class="receipt-flex">
                    <div class="receipt-column">
                        <p><strong>Comprobante #:</strong> ${venta?.id}</p>
                        <p><strong>Fecha:</strong> ${venta ? new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : ''}</p>
                    </div>
                    <div class="receipt-column">
                        <p><strong>Cliente:</strong> ${venta?.cliente_nombre || ''}</p>
                        <p><strong>Vendedor:</strong> ${venta?.usuario_nombre || ''}</p>
                        <p><strong>Almacén:</strong> ${venta?.almacen_nombre || ''}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-right">Precio Unit.</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${venta?.items?.map(item => `
                            <tr>
                                <td>${item.nombre_producto}</td>
                                <td class="text-center">${item.cantidad}</td>
                                <td class="text-right">$${(Number(item.precio_unitario) || 0).toFixed(2)}</td>
                                <td class="text-right">$${((Number(item.precio_unitario) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" class="text-center">No hay items disponibles</td></tr>'}
                    </tbody>
                </table>

                <div class="receipt-totals">
                    <div style="float: right; width: 300px;">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>$${venta ? (Number(venta.subtotal) || 0).toFixed(2) : '0.00'}</span>
                        </div>
                        <div class="total-row">
                            <span>Impuestos:</span>
                            <span>$${venta ? (Number(venta.impuestos) || 0).toFixed(2) : '0.00'}</span>
                        </div>
                        <div class="total-row total-final">
                            <span>TOTAL:</span>
                            <span>$${venta ? (Number(venta.total) || 0).toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                    <div style="clear: both;"></div>
                </div>

                <div class="receipt-footer">
                    <p><strong>¡Gracias por su compra!</strong></p>
                    <p>VINOVAULT - Sistema de Gestión de Inventario</p>
                    <p style="font-size: 0.9em;">Impreso el: ${new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })}</p>
                </div>
            </body>
            </html>
        `;

        // Escribir el contenido y imprimir
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Esperar un momento para que se cargue el contenido
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
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
                                {venta?.items && venta.items.length > 0 ? (
                                    venta.items.map((item: any, index: number) => (
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
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography color="text.secondary">
                                                No hay items disponibles
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
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
                    onClick={handleButtonClick}
                    color="primary"
                >
                    Imprimir Comprobante
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptModal;