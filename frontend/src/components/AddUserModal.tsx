import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useAuth, axiosInstance } from '../context/AuthContext';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal = ({ open, onClose, onUserAdded }: AddUserModalProps) => {
  const { showNotification } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('vendedor');

  const handleSubmit = async () => {
    if (!nombreCompleto || !email || !password) {
      showNotification('Todos los campos son requeridos.', 'error');
      return;
    }

    try {
      await axiosInstance.post('/auth/register', {
        nombre_completo: nombreCompleto,
        email,
        contrasena: password,
        rol,
      });
      showNotification('Usuario creado exitosamente.', 'success');
      onUserAdded();
      onClose();
    } catch (err) {
      showNotification('No se pudo crear el usuario.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Nombre Completo" fullWidth value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
        <TextField margin="dense" label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField margin="dense" label="Contraseña" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormControl fullWidth margin="dense">
          <InputLabel>Rol</InputLabel>
          <Select value={rol} label="Rol" onChange={(e) => setRol(e.target.value)}>
            <MenuItem value="vendedor">Vendedor</MenuItem>
            <MenuItem value="admin">Administrador</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Crear</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;