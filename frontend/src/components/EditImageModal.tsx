import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  useTheme
} from '@mui/material';
import { axiosInstance } from '../context/AuthContext';

// Se define la estructura del objeto 'product' que este componente espera recibir
interface Product {
  id: number;
  nombre: string;
  imagen_url?: string;
}

// Se definen los props que el componente recibirá
interface EditImageModalProps {
  open: boolean;
  onClose: () => void;
  onImageUpdated: () => void; // Esta función se llamará tanto al actualizar como al eliminar
  product: Product | null;
}

const EditImageModal = ({ open, onClose, onImageUpdated, product }: EditImageModalProps) => {
  const [imagen, setImagen] = useState<File | null>(null);
  const [error, setError] = useState('');
  const theme = useTheme();

  // Efecto para limpiar el estado cuando el modal se cierra o cambia de producto
  useEffect(() => {
    if (!open) {
      setImagen(null);
      setError('');
    }
  }, [open]);

  // Maneja la selección de un nuevo archivo de imagen
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImagen(event.target.files[0]);
    }
  };

  // Maneja el envío para actualizar la imagen
  const handleUpdateSubmit = async () => {
    if (!imagen || !product) {
      setError('Debes seleccionar una imagen para subir.');
      return;
    }
    setError('');

    const formData = new FormData();
    formData.append('imagen', imagen);

    try {
      await axiosInstance.put(`/productos/${product.id}/imagen`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onImageUpdated();
      onClose();
    } catch (err) {
      console.error('Error al actualizar la imagen:', err);
      setError('No se pudo actualizar la imagen.');
    }
  };

  // Maneja la eliminación de la imagen existente
  const handleRemoveImage = async () => {
    if (!product) return;
    setError('');
    try {
      await axiosInstance.delete(`/productos/${product.id}/imagen`);
      onImageUpdated();
      onClose();
    } catch (err) {
      console.error('Error al eliminar la imagen:', err);
      setError('No se pudo eliminar la imagen.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Gestionar Imagen de "{product?.nombre}"</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box mt={2} textAlign="center">
          <Button variant="contained" component="label">
            Seleccionar Nueva Imagen
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
          {imagen && <Typography variant="body2" sx={{ mt: 1 }}>{imagen.name}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', padding: '16px 24px' }}>
        {/* Mostramos este botón solo si el producto ya tiene una imagen */}
        {product?.imagen_url ? (
          <Button onClick={handleRemoveImage} color="error">
            Quitar Imagen
          </Button>
        ) : (
          // Dejamos un espacio en blanco para mantener la alineación
          <Box />
        )}
        <Box>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={!imagen}
            sx={{
              color: theme.palette.mode === 'dark' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #d4af37 30%, #f9d976 90%) !important'
                : 'linear-gradient(45deg, #722f37 30%, #a54a56 90%) !important',
            }}
          >
            Actualizar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditImageModal;