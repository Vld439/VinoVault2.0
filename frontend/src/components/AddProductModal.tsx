import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent
} from '@mui/material';
import { axiosInstance, useAuth } from '../context/AuthContext';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

// Interfaz para el objeto Almacen
interface Almacen {
  id: number;
  nombre: string;
}

const AddProductModal = ({ open, onClose, onProductAdded }: AddProductModalProps) => {
  const { showNotification } = useAuth(); // Obtenemos la función de notificación
  
  // Estados para los campos del formulario
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  
  // Nuevos estados para el stock inicial
  const [stockInicial, setStockInicial] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);

  // Efecto para limpiar el formulario y buscar los almacenes cuando el modal se abre
  useEffect(() => {
    if (open) {
      // Limpia todos los campos
      setSku('');
      setNombre('');
      setDescripcion('');
      setPrecioCompra('');
      setPrecioVenta('');
      setImagen(null);
      setStockInicial('');
      setAlmacenId('');

      // Busca la lista de almacenes disponibles
      const fetchAlmacenes = async () => {
        try {
          const response = await axiosInstance.get('/almacenes');
          setAlmacenes(response.data);
        } catch (error) {
          showNotification("No se pudieron cargar los almacenes", 'error');
        }
      };
      fetchAlmacenes();
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImagen(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!sku || !nombre || !precioVenta) {
      showNotification('SKU, Nombre y Precio de Venta son campos requeridos.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('sku', sku);
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio_compra', precioCompra || '0');
    formData.append('precio_venta', precioVenta);
    
    if (stockInicial && almacenId) {
      formData.append('stock_inicial', stockInicial);
      formData.append('almacen_id', almacenId);
    }
    
    if (imagen) {
      formData.append('imagen', imagen);
    }

    try {
      await axiosInstance.post('/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showNotification('Producto añadido exitosamente.', 'success');
      onProductAdded();
      onClose();
    } catch (err) {
      showNotification('No se pudo crear el producto. Revisa los datos.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Añadir Nuevo Producto</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="SKU *" fullWidth value={sku} onChange={(e) => setSku(e.target.value)} />
        <TextField margin="dense" label="Nombre *" fullWidth value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <TextField margin="dense" label="Descripción" fullWidth multiline rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <TextField margin="dense" label="Precio de Compra" type="number" fullWidth value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} />
        <TextField margin="dense" label="Precio de Venta *" type="number" fullWidth value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
        
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>Stock Inicial (Opcional)</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField 
            margin="dense" 
            label="Cantidad Inicial" 
            type="number" 
            fullWidth 
            value={stockInicial} 
            onChange={(e) => setStockInicial(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="almacen-select-label">Almacén</InputLabel>
            <Select
              labelId="almacen-select-label"
              value={almacenId}
              label="Almacén"
              onChange={(e: SelectChangeEvent) => setAlmacenId(e.target.value)}
            >
              <MenuItem value=""><em>Ninguno</em></MenuItem>
              {almacenes.map((almacen) => (
                <MenuItem key={almacen.id} value={almacen.id}>{almacen.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box mt={3}>
          <Button variant="contained" component="label">
            Subir Imagen
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
          {imagen && <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>{imagen.name}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar Producto</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductModal;