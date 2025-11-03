import { useState, useEffect, useCallback } from 'react';
import { useCart, type Currency } from '../context/CartContext';
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
  const { cartItems, removeFromCart, updateCartItemQuantity, getCartSubtotal, clearCart, currency, setCurrency } = useCart();
  const { showNotification } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  // Estados para el cálculo de impuestos
  const [subtotal, setSubtotal] = useState(0);
  const [impuesto, setImpuesto] = useState(0);
  const [total, setTotal] = useState(0);
  const [clienteEsExtranjero, setClienteEsExtranjero] = useState(false);

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

  // Efecto para recalcular el total cuando algo cambia
  useEffect(() => {
    const newSubtotal = getCartSubtotal();
    const newImpuesto = clienteEsExtranjero ? 0 : newSubtotal * 0.10; // 10% de IVA si no es extranjero
    const newTotal = newSubtotal + newImpuesto;
    
    setSubtotal(newSubtotal);
    setImpuesto(newImpuesto);
    setTotal(newTotal);
  }, [cartItems, currency, clienteEsExtranjero, getCartSubtotal]);

  // Actualiza el estado 'es_extranjero' cuando se selecciona un cliente
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
        precio_unitario: item.precio_venta // Siempre guardamos el precio base en USD
      })),
      subtotal: subtotal,
      impuesto: impuesto,
      total: total,
    };

    try {
      await axiosInstance.post('/ventas', ventaData);
      showNotification('Venta registrada exitosamente.', 'success');
      clearCart();
      onSaleComplete();
      onClose();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Error al registrar la venta.', 'error');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Finalizar Venta</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirmVenta} variant="contained" color="primary" disabled={cartItems.length === 0}>
            Confirmar Venta
          </Button>
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