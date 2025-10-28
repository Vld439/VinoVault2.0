import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { axiosInstance, useAuth } from '../context/AuthContext';

// Interfaz para el objeto Product
interface Product {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  total_stock: number;
  imagen_url?: string;
}

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  productToEdit: Product | null;
}

const EditProductModal = ({ open, onClose, onProductUpdated, productToEdit }: EditProductModalProps) => {
  const { showNotification } = useAuth();

  // Estados para los campos del formulario
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');

  // Efecto para pre-llenar el formulario cuando se selecciona un producto
  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setNombre(productToEdit.nombre);
      setDescripcion(productToEdit.descripcion || '');
      setPrecioCompra(productToEdit.precio_compra || '');
      setPrecioVenta(productToEdit.precio_venta || '');
    }
  }, [productToEdit]);

  const handleSubmit = async () => {
    if (!sku || !nombre || !precioVenta || !productToEdit) {
      showNotification('SKU, Nombre y Precio de Venta son campos requeridos.', 'error');
      return;
    }

    const updatedData = {
      sku,
      nombre,
      descripcion,
      precio_compra: precioCompra,
      precio_venta: precioVenta
    };

    try {
      await axiosInstance.put(`/productos/${productToEdit.id}`, updatedData);
      showNotification('Producto actualizado exitosamente.', 'success');
      onProductUpdated();
      onClose();
    } catch (err) {
      showNotification('No se pudo actualizar el producto.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Producto</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="SKU *" fullWidth value={sku} onChange={(e) => setSku(e.target.value)} />
        <TextField margin="dense" label="Nombre *" fullWidth value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <TextField margin="dense" label="Descripción" fullWidth multiline rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <TextField margin="dense" label="Precio de Compra" type="number" fullWidth value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} />
        <TextField margin="dense" label="Precio de Venta *" type="number" fullWidth value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar Cambios</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProductModal;