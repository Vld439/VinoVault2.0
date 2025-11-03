// src/components/AddClientModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
  FormControlLabel, Checkbox 
} from '@mui/material';
import { useAuth, axiosInstance } from '../context/AuthContext';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onClientAdded: (newClient: any) => void;
}

const AddClientModal = ({ open, onClose, onClientAdded }: AddClientModalProps) => {
  const { showNotification } = useAuth();
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [esExtranjero, setEsExtranjero] = useState(false); // <-- Nuevo estado
  const [error, setError] = useState('');

  // Limpia el formulario al abrir
  useEffect(() => {
    if (open) {
      setNombre('');
      setRuc('');
      setTelefono('');
      setEmail('');
      setEsExtranjero(false);
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!nombre) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    setError('');

    try {
      const response = await axiosInstance.post('/clientes', { 
        nombre, 
        ruc, 
        telefono, 
        email, 
        es_extranjero: esExtranjero 
      });
      showNotification('Cliente creado exitosamente.', 'success');
      onClientAdded(response.data);
      onClose();
    } catch (err) {
      showNotification('No se pudo crear el cliente.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField autoFocus margin="dense" label="Nombre *" fullWidth value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <TextField margin="dense" label="RUC / C.I." fullWidth value={ruc} onChange={(e) => setRuc(e.target.value)} />
        <TextField margin="dense" label="Teléfono" fullWidth value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <TextField margin="dense" label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        {/* CHECKBOX */}
        <FormControlLabel
          control={
            <Checkbox
              checked={esExtranjero}
              onChange={(e) => setEsExtranjero(e.target.checked)}
              name="esExtranjero"
              color="primary"
            />
          }
          label="¿Es Extranjero?"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar Cliente</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClientModal;