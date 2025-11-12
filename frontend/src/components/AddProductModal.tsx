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
  type SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Stack
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
  const { showNotification } = useAuth();
  
  // Para ajustar el modal en móviles
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      fullScreen={isMobile} // Pantalla completa en móviles
      PaperProps={{
        sx: {
          m: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        py: isMobile ? 2 : 3
      }}>
        Añadir Nuevo Producto
      </DialogTitle>
      <DialogContent sx={{ 
        px: isMobile ? 2 : 3,
        pb: isMobile ? 2 : 3
      }}>
        <Stack spacing={isMobile ? 2 : 2.5}>
          <TextField 
            autoFocus 
            label="SKU *" 
            fullWidth 
            size={isMobile ? "small" : "medium"}
            value={sku} 
            onChange={(e) => setSku(e.target.value)} 
          />
          <TextField 
            label="Nombre *" 
            fullWidth 
            size={isMobile ? "small" : "medium"}
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
          />
          <TextField 
            label="Descripción" 
            fullWidth 
            multiline 
            rows={isMobile ? 2 : 3}
            size={isMobile ? "small" : "medium"}
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
          />
          
          {/* Precios en columnas en desktop, apilados en móvil */}
          <Stack direction={isMobile ? "column" : "row"} spacing={2}>
            <TextField 
              label="Precio de Compra" 
              type="number" 
              fullWidth 
              size={isMobile ? "small" : "medium"}
              value={precioCompra} 
              onChange={(e) => setPrecioCompra(e.target.value)} 
            />
            <TextField 
              label="Precio de Venta *" 
              type="number" 
              fullWidth 
              size={isMobile ? "small" : "medium"}
              value={precioVenta} 
              onChange={(e) => setPrecioVenta(e.target.value)} 
            />
          </Stack>
          
          <Typography 
            variant={isMobile ? "body1" : "subtitle1"} 
            sx={{ color: 'text.secondary', fontWeight: 'medium' }}
          >
            Stock Inicial (Opcional)
          </Typography>
          
          {/* Stock inicial también adaptativo */}
          <Stack direction={isMobile ? "column" : "row"} spacing={2}>
            <TextField 
              label="Cantidad Inicial" 
              type="number" 
              fullWidth 
              size={isMobile ? "small" : "medium"}
              value={stockInicial} 
              onChange={(e) => setStockInicial(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel 
                id="almacen-select-label"
                size={isMobile ? "small" : "medium"}
              >
                Almacén
              </InputLabel>
              <Select
                labelId="almacen-select-label"
                value={almacenId}
                label="Almacén"
                size={isMobile ? "small" : "medium"}
                onChange={(e: SelectChangeEvent) => setAlmacenId(e.target.value)}
              >
                <MenuItem value=""><em>Ninguno</em></MenuItem>
                {almacenes.map((almacen) => (
                  <MenuItem key={almacen.id} value={almacen.id}>{almacen.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Box mt={3}>
          <Button 
            variant="outlined" 
            component="label"
            size={isMobile ? "medium" : "large"}
            sx={{ 
              py: isMobile ? 1.5 : 2,
              textTransform: 'none',
              width: '100%'
            }}
          >
            {imagen ? `📷 ${imagen.name}` : '📷 Seleccionar Imagen'}
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        px: isMobile ? 2 : 3,
        py: isMobile ? 2 : 3,
        gap: 1,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Button 
          onClick={onClose}
          size={isMobile ? "medium" : "large"}
          fullWidth={isMobile}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          size={isMobile ? "medium" : "large"}
          fullWidth={isMobile}
        >
          Guardar Producto
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductModal;