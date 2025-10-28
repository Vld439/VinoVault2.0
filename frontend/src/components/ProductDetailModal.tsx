import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Icon,
    TableContainer
} from '@mui/material';
import { axiosInstance, useAuth } from '../context/AuthContext';
import AdjustStockModal from './AdjustStockModal';

interface StockInfo {
  almacen_id: number;
  almacen_nombre: string;
  cantidad: number;
}

interface ProductDetails {
  id: number;
  nombre: string;
  sku: string;
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  inventario: StockInfo[];
}

interface ProductDetailModalProps {
  productId: number | null;
  open: boolean;
  onClose: () => void;
  onStockUpdated: () => void;
}

const ProductDetailModal = ({ productId, open, onClose, onStockUpdated }: ProductDetailModalProps) => {
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [movementType, setMovementType] = useState<'Entrada' | 'Salida'>('Entrada');
  const { user } = useAuth();

  const fetchDetails = async () => {
      if (!productId) return;
      setIsLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get(`/productos/${productId}`);
        setDetails(response.data);
      } catch (err) {
        setError('No se pudieron cargar los detalles del producto.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (open) {
      fetchDetails();
    }
  }, [open, productId]);

  const handleOpenAdjustModal = (stock: StockInfo, type: 'Entrada' | 'Salida') => {
    setSelectedStock(stock);
    setMovementType(type);
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (cantidad: number) => {
    if (!selectedStock || !details || !user) return;
    try {
      await axiosInstance.post('/inventario/movimiento', {
        producto_id: details.id,
        almacen_id: selectedStock.almacen_id,
        cantidad: cantidad,
        tipo_movimiento: cantidad > 0 ? 'Entrada Manual' : 'Salida Manual'
      });
      setAdjustModalOpen(false);
      fetchDetails();
      onStockUpdated();
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Detalles del Producto</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : details ? (
            <Box>
              <Typography variant="h5" gutterBottom>{details.nombre}</Typography>
              
              <Typography variant="body1"><strong>SKU:</strong> {details.sku}</Typography>
              <Typography variant="body1"><strong>Descripción:</strong> {details.descripcion}</Typography>
              <Typography variant="body1"><strong>Precio de Compra:</strong> ${parseFloat(details.precio_compra).toFixed(2)}</Typography>
              <Typography variant="body1"><strong>Precio de Venta:</strong> ${parseFloat(details.precio_venta).toFixed(2)}</Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Inventario Actual</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Almacén</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.inventario.map((stock) => (
                      <TableRow key={stock.almacen_nombre}>
                        <TableCell component="th" scope="row">{stock.almacen_nombre}</TableCell>
                        <TableCell align="center">{stock.cantidad}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="success" onClick={() => handleOpenAdjustModal(stock, 'Entrada')}>
                            <Icon>add_circle</Icon>
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleOpenAdjustModal(stock, 'Salida')}>
                            <Icon>remove_circle</Icon>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {selectedStock && (
        <AdjustStockModal
          open={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          onSubmit={handleAdjustSubmit}
          tipoMovimiento={movementType}
          almacenNombre={selectedStock.almacen_nombre}
        />
      )}
    </>
  );
};

export default ProductDetailModal;