import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
// ----- 1. IMPORTA 'CartItem' AQUÍ -----
import { useCart, type Currency, type CartItem } from '../context/CartContext';
import { useAuth, axiosInstance } from '../context/AuthContext';
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

  // Configuración profesional de react-to-print
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Venta-${saleSuccessData?.ventaId || 'recibo'}`,
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
      console.log('Preparando impresión del recibo...');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Impresión completada exitosamente');
    }
  });

  const handleCloseModal = () => {
    onClose();
    setSaleSuccessData(null);
    setSelectedCliente('');
    setSelectedAlmacen('');
  };

  // Componente visual para el Recibo (siempre tema claro)
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
          RECIBO DE VENTA
        </Typography>
        <Typography variant="h6" sx={{ color: '#666', mt: 1 }}>
          Vino Vault - Sistema de Gestión
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
            // --- VISTA DE ÉXITO Y RECIBO ---
            renderReceipt()
          ) : (
            // --- VISTA DE CHECKOUT ---
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
                                        src={item.imagen_url ? `http://localhost:5001/${item.imagen_url}` : `https://placehold.co/60x60/212121/90caf9?text=${item.nombre.charAt(0)}`}
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
              <Button onClick={handlePrint} variant="contained" color="primary">Imprimir Recibo</Button>
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