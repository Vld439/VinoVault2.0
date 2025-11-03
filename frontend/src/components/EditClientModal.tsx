// src/components/EditClientModal.tsx
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, 
  FormControlLabel, Checkbox 
} from '@mui/material';
import { useAuth, axiosInstance } from '../context/AuthContext';

// Interfaz para el objeto Cliente
interface Cliente {
  id: number;
  nombre: string;
  ruc: string;
  telefono: string;
  email: string;
  es_extranjero?: boolean; 
}

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  onClientUpdated: () => void;
  clientToEdit: Cliente | null;
}

const EditClientModal = ({ open, onClose, onClientUpdated, clientToEdit }: EditClientModalProps) => {
  const { showNotification } = useAuth();
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [esExtranjero, setEsExtranjero] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setNombre(clientToEdit.nombre);
      setRuc(clientToEdit.ruc || '');
      setTelefono(clientToEdit.telefono || '');
      setEmail(clientToEdit.email || '');
      setEsExtranjero(clientToEdit.es_extranjero || false);
    }
  }, [clientToEdit]);

  const handleSubmit = async () => {
    if (!clientToEdit) return;
    try {
      await axiosInstance.put(`/clientes/${clientToEdit.id}`, { 
        nombre, 
        ruc, 
        telefono, 
        email, 
        es_extranjero: esExtranjero
      });
      showNotification('Cliente actualizado.', 'success');
      onClientUpdated();
      onClose();
    } catch (err) {
      showNotification('No se pudo actualizar el cliente.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar Cliente</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Nombre *" fullWidth value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <TextField margin="dense" label="RUC / C.I." fullWidth value={ruc} onChange={(e) => setRuc(e.target.value)} />
        <TextField margin="dense" label="Teléfono" fullWidth value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <TextField margin="dense" label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        {/*Checkbox*/}
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
        <Button onClick={handleSubmit} variant="contained">Guardar Cambios</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClientModal;