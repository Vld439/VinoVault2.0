import { useState, useEffect, useCallback } from 'react';
import { useCart, type Currency } from '../context/CartContext';
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
  Paper,
  MenuItem
} from '@mui/material';
import { Print as PrintIcon, CheckCircle } from '@mui/icons-material';
import AddClientModal from './AddClientModal';
import { formatCurrency } from '../utils/formatCurrency';
import { usePrintReceipt } from '../hooks/usePrintReceipt';

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
  const { handlePrint } = usePrintReceipt();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clienteEsExtranjero, setClienteEsExtranjero] = useState(false);
  const [saleSuccessData, setSaleSuccessData] = useState<any>(null);

  // Cálculos de totales
  const subtotal = getCartSubTotal();
  const impuesto = clienteEsExtranjero ? 0 : subtotal * 0.10;
  const total = subtotal + impuesto;

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

  const handlePrintReceipt = () => {
    if (!saleSuccessData) return;
    
    const printData = {
      ventaId: saleSuccessData.ventaId,
      fecha: saleSuccessData.fecha,
      clientName: saleSuccessData.clientName,
      vendedor: saleSuccessData.vendedor,
      almacenName: saleSuccessData.almacenName,
      items: saleSuccessData.items,
      subtotal: saleSuccessData.subtotal,
      impuesto: saleSuccessData.impuesto,
      total: saleSuccessData.total
    };
    
    handlePrint(printData);
  };

  const handleCloseModal = () => {
    onClose();
    setSaleSuccessData(null);
    setSelectedCliente('');
    setSelectedAlmacen('');
  };

  const renderSaleSuccess = () => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
        ¡Venta Completada!
      </Typography>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Venta #{saleSuccessData.ventaId}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Cliente: {saleSuccessData.clientName}
      </Typography>
      
      <Box sx={{ 
        bgcolor: '#f5f5f5', 
        p: 2, 
        borderRadius: 2, 
        mb: 3,
        textAlign: 'right'
      }}>
        <Typography variant="body1" sx={{ mb: 0.5 }}>
          Subtotal: {formatCurrency(saleSuccessData.subtotal, currency)}
        </Typography>
        <Typography variant="body1" sx={{ mb: 0.5 }}>
          IVA (10%): {formatCurrency(saleSuccessData.impuesto, currency)}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          TOTAL: {formatCurrency(saleSuccessData.total, currency)}
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary">
        {new Date().toLocaleString('es-ES')}
      </Typography>
    </Box>
  );

  const renderCheckout = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Resumen del Carrito</Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quitar</TableCell>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img
                        src={getImageUrl(item.imagen_url)}
                        alt={item.nombre}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <Typography variant="body2">{item.nombre}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      sx={{ width: '70px' }}
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
                    <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                      <Icon color="error">delete</Icon>
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Controles de moneda y totales */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <Typography variant="body1">Subtotal: {formatCurrency(subtotal, currency)}</Typography>
          <Typography variant="body1">IVA (10%): {formatCurrency(impuesto, currency)}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Total: {formatCurrency(total, currency)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />
      
      {/* Selecciones de cliente y almacén */}
      <Typography variant="h6" sx={{ mb: 2 }}>Detalles de la Venta</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl fullWidth>
          <InputLabel>Cliente *</InputLabel>
          <Select
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
          <InputLabel>Descontar Stock de Almacén *</InputLabel>
          <Select
            value={selectedAlmacen}
            label="Descontar Stock de Almacén *"
            onChange={(e) => setSelectedAlmacen(e.target.value)}
          >
            {almacenes.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: saleSuccessData ? 'success.main' : 'primary.main', color: 'white' }}>
          {saleSuccessData ? 'Venta Completada' : 'Finalizar Venta'}
        </DialogTitle>
        <DialogContent>
          {saleSuccessData ? renderSaleSuccess() : renderCheckout()}
        </DialogContent>
        <DialogActions>
          {saleSuccessData ? (
            <>
              <Button onClick={handleCloseModal}>Cerrar</Button>
              <Button 
                onClick={handlePrintReceipt} 
                variant="contained" 
                color="primary" 
                startIcon={<PrintIcon />}
              >
                Imprimir Comprobante
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button 
                onClick={handleConfirmVenta} 
                variant="contained" 
                color="primary" 
                disabled={cartItems.length === 0}
              >
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