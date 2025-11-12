import { useState, useEffect, useCallback, useRef } from 'react';
// ----- 1. IMPORTA 'CartItem' AQUÍ -----
import { useCart, type Currency, type CartItem } from '../context/CartContext';
import { useAuth, axiosInstance } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Icon,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import AddClientModal from './AddClientModal';
import { formatCurrency } from '../utils/formatCurrency';
import logo from '../assets/logo.png';

// Interfaces para los objetos que se reciben de la API
interface Cliente {
  id: number;
  nombre: string;
  es_extranjero: boolean;
}
interface Almacen {
  id: number;
  nombre: string;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSaleComplete: () => void;
}

const CheckoutModal = ({ open, onClose, onSaleComplete }: CheckoutModalProps) => {
  const { cartItems, removeFromCart, updateCartItemQuantity, getCartSubTotal, clearCart, currency, setCurrency } = useCart();
  const { user, showNotification } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [subtotal, setSubtotal] = useState(0);
  const [impuesto, setImpuesto] = useState(0);
  const [total, setTotal] = useState(0);
  const [clienteEsExtranjero, setClienteEsExtranjero] = useState(false);

  const [saleSuccessData, setSaleSuccessData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/clientes');
      setClientes(res.data);
    } catch {
      showNotification('No se pudieron cargar los clientes.', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    if (open) {
      fetchClientes();
      axiosInstance.get('/almacenes')
        .then(res => setAlmacenes(res.data))
        .catch(() => showNotification('No se pudieron cargar los almacenes.', 'error'));
    }
  }, [open, fetchClientes, showNotification]);

  useEffect(() => {
    const newSubtotal = getCartSubTotal();
    const newImpuesto = clienteEsExtranjero ? 0 : newSubtotal * 0.10;
    const newTotal = newSubtotal + newImpuesto;
    
    setSubtotal(newSubtotal);
    setImpuesto(newImpuesto);
    setTotal(newTotal);
  }, [cartItems, currency, clienteEsExtranjero, getCartSubTotal]);

  const handleSelectCliente = (clienteId: string) => {
    setSelectedCliente(clienteId);
    const cliente = clientes.find(c => c.id === Number(clienteId));
    setClienteEsExtranjero(cliente?.es_extranjero || false);
  };

  const handleConfirmVenta = async () => {
    if (!selectedCliente || !selectedAlmacen) {
      showNotification('Por favor, selecciona un cliente y un almacén.', 'warning');
      return;
    }

    const ventaData = {
      cliente_id: selectedCliente,
      almacen_id: selectedAlmacen,
      moneda: currency,
      items: cartItems.map(item => ({
        producto_id: item.id,
        cantidad: item.quantity,
        precio_unitario: item.precio_venta
      })),
      subtotal: subtotal,
      impuesto: impuesto,
      total: total,
    };
    
    const clientName = clientes.find(c => c.id === Number(selectedCliente))?.nombre;
    const almacenName = almacenes.find(a => a.id === Number(selectedAlmacen))?.nombre;

    try {
      const response = await axiosInstance.post('/ventas', ventaData);
      showNotification('Venta registrada exitosamente.', 'success');
      
      setSaleSuccessData({
        ...ventaData,
        ventaId: response.data.ventaId,
        clientName,
        almacenName,
        items: cartItems,
        fecha: new Date(),
        vendedor: user?.nombre_completo,
        total,
        subtotal,
        impuesto
      });

      clearCart();
      onSaleComplete();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Error al registrar la venta.', 'error');
    }
  };

  // Función de impresión con detección de dispositivo (igual que ReceiptModal)
  const handlePrint = () => {
    if (!saleSuccessData) {
      console.warn('No hay datos de venta para imprimir');
      return;
    }

    // Verificar si estamos en móvil
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // En móvil, usar ventana con controles manuales
      printMobileReceipt();
    } else {
      // En desktop, usar ventana nueva optimizada
      printDesktopReceipt();
    }
  };

  const printMobileReceipt = () => {
    // Crear ventana en pantalla completa para móvil
    const printWindow = window.open('', '_blank', 'fullscreen=yes,scrollbars=yes');
    
    if (!printWindow) {
      console.warn('No se pudo abrir ventana de impresión. Verifica permisos de pop-up.');
      return;
    }

    // HTML con controles manuales
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
          <title>Comprobante Venta #${saleSuccessData.ventaId}</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  font-size: 16px; 
                  line-height: 1.5; 
                  color: #000; 
                  background: #fff; 
                  padding: 20px;
                  margin: 0;
              }
              .controls {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  background: #333;
                  padding: 10px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  z-index: 1000;
              }
              .btn {
                  background: #1976d2;
                  color: white;
                  border: none;
                  padding: 12px 20px;
                  font-size: 16px;
                  border-radius: 5px;
                  cursor: pointer;
                  margin: 0 5px;
              }
              .btn-close { background: #d32f2f; }
              .btn:hover { opacity: 0.8; }
              .receipt-container {
                  margin-top: 60px;
                  max-width: 100%;
                  background: white;
                  padding: 20px;
                  border: 1px solid #ddd;
              }
              .header { 
                  text-align: center; 
                  border-bottom: 2px solid #000; 
                  padding-bottom: 15px; 
                  margin-bottom: 20px; 
              }
              .header h1 { 
                  color: #1976d2; 
                  font-size: 28px; 
                  margin: 0 0 10px 0; 
              }
              .info-section {
                  margin-bottom: 25px;
              }
              .info-row { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 10px; 
                  padding: 8px 0;
                  border-bottom: 1px dotted #ccc;
                  font-size: 16px;
              }
              .products-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 25px 0; 
                  font-size: 15px;
              }
              .products-table th, 
              .products-table td { 
                  border: 1px solid #000; 
                  padding: 12px 10px; 
                  text-align: left; 
              }
              .products-table th { 
                  background: #f0f0f0; 
                  font-weight: bold; 
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .totals-section { 
                  border-top: 2px solid #000; 
                  padding-top: 20px; 
                  margin-top: 25px; 
              }
              .total-final { 
                  font-weight: bold; 
                  font-size: 20px; 
                  border-top: 1px solid #000; 
                  padding-top: 15px; 
                  margin-top: 15px; 
              }
              .footer { 
                  text-align: center; 
                  margin-top: 40px; 
                  padding-top: 25px; 
                  border-top: 1px dashed #000; 
              }
              
              @media print {
                  .controls { display: none !important; }
                  body { padding: 0; margin: 0; }
                  .receipt-container { 
                      margin-top: 0; 
                      border: none; 
                      padding: 20px; 
                  }
              }
          </style>
      </head>
      <body>
          <div class="controls">
              <button class="btn btn-close" onclick="window.close()">✖ Cerrar</button>
              <div>
                  <span style="color: white; font-weight: bold;">Venta #${saleSuccessData.ventaId}</span>
              </div>
              <button class="btn" onclick="window.print()">🖨️ Imprimir</button>
          </div>
          
          <div class="receipt-container">
              <div class="header">
                  <h1>VINOVAULT</h1>
                  <p style="margin: 10px 0; font-size: 18px;">Sistema de Gestión de Inventario</p>
                  <h2 style="margin-top: 20px; font-size: 22px; color: #333;">COMPROBANTE DE VENTA</h2>
              </div>

              <div class="info-section">
                  <div class="info-row">
                      <strong>N° de Venta:</strong>
                      <span>#${saleSuccessData.ventaId}</span>
                  </div>
                  <div class="info-row">
                      <strong>Fecha:</strong>
                      <span>${new Date(saleSuccessData.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}</span>
                  </div>
                  <div class="info-row">
                      <strong>Cliente:</strong>
                      <span>${saleSuccessData.clientName || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                      <strong>Vendedor:</strong>
                      <span>${saleSuccessData.vendedor || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                      <strong>Almacén:</strong>
                      <span>${saleSuccessData.almacenName || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                      <strong>Moneda:</strong>
                      <span>${currency}</span>
                  </div>
              </div>

              <table class="products-table">
                  <thead>
                      <tr>
                          <th>Producto</th>
                          <th class="text-center" style="width: 100px;">Cantidad</th>
                          <th class="text-right" style="width: 120px;">Precio Unit.</th>
                          <th class="text-right" style="width: 120px;">Subtotal</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${saleSuccessData.items?.map((item: CartItem) => {
                          let price = item.precio_venta;
                          if (currency === 'PYG' && item.precio_venta_pyg) { price = item.precio_venta_pyg; }
                          if (currency === 'BRL' && item.precio_venta_brl) { price = item.precio_venta_brl; }
                          const itemSubtotal = parseFloat(price) * item.quantity;
                          return `
                              <tr>
                                  <td>${item.nombre}</td>
                                  <td class="text-center">${item.quantity}</td>
                                  <td class="text-right">${formatCurrency(price, currency)}</td>
                                  <td class="text-right">${formatCurrency(itemSubtotal, currency)}</td>
                              </tr>
                          `;
                      }).join('') || '<tr><td colspan="4" class="text-center">No hay productos disponibles</td></tr>'}
                  </tbody>
              </table>

              <div class="totals-section">
                  <div class="info-row">
                      <strong>Subtotal:</strong>
                      <span>${formatCurrency(saleSuccessData.subtotal, currency)}</span>
                  </div>
                  <div class="info-row">
                      <strong>IVA (10%):</strong>
                      <span>${formatCurrency(saleSuccessData.impuesto, currency)}</span>
                  </div>
                  <div class="info-row total-final">
                      <strong>TOTAL:</strong>
                      <strong>${formatCurrency(saleSuccessData.total, currency)}</strong>
                  </div>
              </div>

              <div class="footer">
                  <p style="font-size: 18px;"><strong>¡Gracias por su compra!</strong></p>
                  <p style="margin: 10px 0; font-size: 16px;">VINOVAULT - Sistema de Gestión de Inventario</p>
                  <p style="margin-top: 15px; font-size: 14px; color: #666;">
                      Documento generado el: ${new Date().toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Escribir contenido y enfocar ventana
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const printDesktopReceipt = () => {
    // Crear una nueva ventana para imprimir en desktop
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Crear el contenido HTML completo optimizado para desktop
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Comprobante Venta #${saleSuccessData?.ventaId}</title>
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
                  <p><strong>N° de Venta:</strong> #${saleSuccessData?.ventaId}</p>
                  <p><strong>Fecha:</strong> ${new Date(saleSuccessData?.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                  })}</p>
                  <p><strong>Moneda:</strong> ${currency}</p>
              </div>
              <div class="receipt-column">
                  <p><strong>Cliente:</strong> ${saleSuccessData?.clientName || ''}</p>
                  <p><strong>Vendedor:</strong> ${saleSuccessData?.vendedor || ''}</p>
                  <p><strong>Almacén:</strong> ${saleSuccessData?.almacenName || ''}</p>
              </div>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>Producto</th>
                      <th class="text-center">Cantidad</th>
                      <th class="text-right">Precio Unit.</th>
                      <th class="text-right">Subtotal</th>
                  </tr>
              </thead>
              <tbody>
                  ${saleSuccessData?.items?.map((item: CartItem) => {
                      let price = item.precio_venta;
                      if (currency === 'PYG' && item.precio_venta_pyg) { price = item.precio_venta_pyg; }
                      if (currency === 'BRL' && item.precio_venta_brl) { price = item.precio_venta_brl; }
                      const itemSubtotal = parseFloat(price) * item.quantity;
                      return `
                          <tr>
                              <td>${item.nombre}</td>
                              <td class="text-center">${item.quantity}</td>
                              <td class="text-right">${formatCurrency(price, currency)}</td>
                              <td class="text-right">${formatCurrency(itemSubtotal, currency)}</td>
                          </tr>
                      `;
                  }).join('') || '<tr><td colspan="4" class="text-center">No hay productos disponibles</td></tr>'}
              </tbody>
          </table>

          <div class="receipt-totals">
              <div style="float: right; width: 300px;">
                  <div class="total-row">
                      <span>Subtotal:</span>
                      <span>${formatCurrency(saleSuccessData?.subtotal, currency)}</span>
                  </div>
                  <div class="total-row">
                      <span>IVA (10%):</span>
                      <span>${formatCurrency(saleSuccessData?.impuesto, currency)}</span>
                  </div>
                  <div class="total-row total-final">
                      <span>TOTAL:</span>
                      <span>${formatCurrency(saleSuccessData?.total, currency)}</span>
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

  const handleCloseModal = () => {
    onClose();
    setSaleSuccessData(null);
    setSelectedCliente('');
    setSelectedAlmacen('');
  };

  // Componente visual para el Comprobante (siempre tema claro)
  const renderReceipt = () => (
    <Box ref={receiptRef} sx={{ 
      p: 3, 
      color: '#000',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Box className="receipt-header" sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #000', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img src={logo} alt="Logo" style={{ height: '80px', maxWidth: '200px' }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000' }}>
          COMPROBANTE DE VENTA
        </Typography>
        <Typography variant="h6" sx={{ color: '#666', mt: 1 }}>
          VinoVault - Sistema de Gestión
        </Typography>
      </Box>

      <Box className="receipt-details" sx={{ mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body1" sx={{ color: '#000' }}>
              <strong>N° de Venta:</strong> #{saleSuccessData.ventaId}
            </Typography>
            <Typography variant="body1" sx={{ color: '#000' }}>
              <strong>Fecha:</strong> {new Date(saleSuccessData.fecha).toLocaleString('es-ES')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#000' }}>
              <strong>Moneda:</strong> {currency}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1" sx={{ color: '#000' }}>
              <strong>Cliente:</strong> {saleSuccessData.clientName}
            </Typography>
            <Typography variant="body1" sx={{ color: '#000' }}>
              <strong>Vendedor:</strong> {saleSuccessData.vendedor}
            </Typography>
            <Typography variant="body1" sx={{ color: '#000' }}>
              <strong>Almacén:</strong> {saleSuccessData.almacenName}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <TableContainer component={Paper} elevation={0} sx={{ my: 3, border: '1px solid #000', backgroundColor: '#ffffff' }}>
        <Table size="medium" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', backgroundColor: '#ffffff' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', color: '#000', backgroundColor: '#f5f5f5' }}>Producto</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#000', backgroundColor: '#f5f5f5' }}>Cantidad</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#000', backgroundColor: '#f5f5f5' }}>Precio Unitario</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#000', backgroundColor: '#f5f5f5' }}>Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {saleSuccessData.items.map((item: CartItem) => {
              let price = item.precio_venta;
              if (currency === 'PYG' && item.precio_venta_pyg) { price = item.precio_venta_pyg; }
              if (currency === 'BRL' && item.precio_venta_brl) { price = item.precio_venta_brl; }
              return (
                <TableRow key={item.id}>
                  <TableCell sx={{ color: '#000', padding: '12px', backgroundColor: '#ffffff' }}>{item.nombre}</TableCell>
                  <TableCell align="center" sx={{ color: '#000', padding: '12px', backgroundColor: '#ffffff' }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ color: '#000', padding: '12px', backgroundColor: '#ffffff' }}>{formatCurrency(price, currency)}</TableCell>
                  <TableCell align="right" sx={{ color: '#000', padding: '12px', fontWeight: 'bold', backgroundColor: '#ffffff' }}>
                    {formatCurrency(parseFloat(price) * item.quantity, currency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box className="receipt-totals" sx={{ 
        mt: 3, 
        pt: 2, 
        borderTop: '2px solid #000',
        textAlign: 'right'
      }}>
        <Typography variant="h6" sx={{ color: '#000', mb: 1 }}>
          <strong>Subtotal: {formatCurrency(saleSuccessData.subtotal, currency)}</strong>
        </Typography>
        <Typography variant="h6" sx={{ color: '#000', mb: 1 }}>
          <strong>IVA (10%): {formatCurrency(saleSuccessData.impuesto, currency)}</strong>
        </Typography>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#000', 
          mt: 2,
          p: 1,
          backgroundColor: '#f5f5f5',
          border: '2px solid #000',
          borderRadius: 1
        }}>
          TOTAL: {formatCurrency(saleSuccessData.total, currency)}
        </Typography>
      </Box>


      <Box sx={{ 
        mt: 4, 
        pt: 2, 
        borderTop: '1px solid #000',
        textAlign: 'center'
      }}>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Gracias por su compra - Vino Vault
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Fecha de impresión: {new Date().toLocaleString('es-ES')}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="md">
        <DialogTitle>{saleSuccessData ? 'Venta Completada' : 'Finalizar Venta'}</DialogTitle>
        <DialogContent>
          
          {saleSuccessData ? (
            //VISTA DE ÉXITO Y COMPROBANTE
            renderReceipt()
          ) : (
            //VISTA DE CHECKOUT
            <Box>
              <Typography variant="h6" gutterBottom>Resumen del Carrito</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Cantidad</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Unit.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Subtotal</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Quitar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cartItems.map(item => {
                        let price = item.precio_venta;
                        if (currency === 'PYG' && item.precio_venta_pyg) { price = item.precio_venta_pyg; }
                        if (currency === 'BRL' && item.precio_venta_brl) { price = item.precio_venta_brl; }
                        const itemSubtotal = parseFloat(price) * item.quantity;
                        
                        return (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <img
                                        src={getImageUrl(item.imagen_url)}
                                        alt={item.nombre}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                        <Typography variant="body2">{item.nombre}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                <TextField
                                    type="number"
                                    size="small"
                                    sx={{ width: '80px' }}
                                    value={item.quantity}
                                    onChange={(e) => updateCartItemQuantity(item.id, Number(e.target.value))}
                                    inputProps={{ min: 1, max: item.total_stock }}
                                />
                                </TableCell>
                                <TableCell align="right">{formatCurrency(price, currency)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(itemSubtotal, currency)}
                                </TableCell>
                                <TableCell align="center">
                                <IconButton edge="end" aria-label="delete" onClick={() => removeFromCart(item.id)}>
                                    <Icon color="error">delete</Icon>
                                </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', mt: 2, gap: 2 }}>
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={currency}
                    label="Moneda"
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="PYG">PYG</MenuItem>
                    <MenuItem value="BRL">BRL</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1">
                    Subtotal: {formatCurrency(subtotal, currency)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    IVA (10%): {formatCurrency(impuesto, currency)}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Total: {formatCurrency(total, currency)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6">Detalles de la Venta</Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel id="cliente-select-label">Cliente *</InputLabel>
                  <Select
                    labelId="cliente-select-label"
                    value={selectedCliente}
                    label="Cliente *"
                    onChange={(e) => handleSelectCliente(e.target.value)}
                  >
                    {clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
                <IconButton color="primary" onClick={() => setIsAddClientModalOpen(true)}>
                  <Icon>add_circle</Icon>
                </IconButton>
                <FormControl fullWidth>
                  <InputLabel id="almacen-select-label">Descontar Stock de Almacén *</InputLabel>
                  <Select
                    labelId="almacen-select-label"
                    value={selectedAlmacen}
                    label="Descontar Stock de Almacén *"
                    onChange={(e) => setSelectedAlmacen(e.target.value)}
                  >
                    {almacenes.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {saleSuccessData ? (
            <>
              <Button onClick={handleCloseModal}>Cerrar</Button>
              <Button onClick={handlePrint} variant="contained" color="primary">Imprimir Comprobante</Button>
            </>
          ) : (
            <>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button onClick={handleConfirmVenta} variant="contained" color="primary" disabled={cartItems.length === 0}>
                Confirmar Venta
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <AddClientModal
        open={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={(newClient) => {
          fetchClientes();
          setSelectedCliente(String(newClient.id));
          setClienteEsExtranjero(newClient.es_extranjero || false);
        }}
      />
    </>
  );
};

export default CheckoutModal;