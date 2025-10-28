import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAuth, axiosInstance } from '../context/AuthContext';

interface User {
  id: number;
  nombre_completo: string;
  email: string;
  rol: 'admin' | 'vendedor';
}

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  userToEdit: User | null;
}

const EditUserModal = ({ open, onClose, onUserUpdated, userToEdit }: EditUserModalProps) => {
  const { showNotification } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'admin' | 'vendedor'>('vendedor');

  useEffect(() => {
    if (userToEdit) {
      setNombreCompleto(userToEdit.nombre_completo);
      setEmail(userToEdit.email);
      setRol(userToEdit.rol);
    }
  }, [userToEdit]);

  const handleSubmit = async () => {
    if (!userToEdit) return;
    try {
      await axiosInstance.put(`/users/${userToEdit.id}`, { nombre_completo: nombreCompleto, email, rol });
      showNotification('Usuario actualizado.', 'success');
      onUserUpdated();
      onClose();
    } catch (err) {
      showNotification('No se pudo actualizar el usuario.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar Usuario</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Nombre Completo" fullWidth value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
        <TextField margin="dense" label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormControl fullWidth margin="dense">
          <InputLabel>Rol</InputLabel>
          <Select value={rol} label="Rol" onChange={(e) => setRol(e.target.value as 'admin' | 'vendedor')}>
            <MenuItem value="vendedor">Vendedor</MenuItem>
            <MenuItem value="admin">Administrador</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar Cambios</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;