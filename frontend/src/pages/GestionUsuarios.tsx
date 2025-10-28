// src/pages/GestionUsuarios.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Box, Button, IconButton, Icon,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth, axiosInstance } from '../context/AuthContext';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

// Interfaz para el objeto Usuario
interface User {
  id: number;
  nombre_completo: string;
  email: string;
  rol: 'admin' | 'vendedor';
}

const GestionUsuariosPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useAuth();
    
    // Estados para los modales
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/users');
            setUsers(response.data);
        } catch (error) {
            showNotification('No se pudo cargar la lista de usuarios.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteConfirm = async () => {
      if (!userToDelete) return;
      try {
        await axiosInstance.delete(`/users/${userToDelete.id}`);
        showNotification('Usuario eliminado.', 'success');
        setUserToDelete(null);
        fetchUsers();
      } catch (error) {
        showNotification('No se pudo eliminar el usuario.', 'error');
      }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Gestión de Usuarios
                </Typography>
                <Box>
                    <Button variant="contained" onClick={() => setIsAddModalOpen(true)}>
                        Crear Nuevo Usuario
                    </Button>
                    <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ ml: 2 }}>
                        Volver al Dashboard
                    </Button>
                </Box>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.nombre_completo}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.rol}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => setUserToEdit(user)}>
                                            <Icon>edit</Icon>
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => setUserToDelete(user)}>
                                            <Icon>delete</Icon>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modales */}
            <AddUserModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onUserAdded={fetchUsers} />
            <EditUserModal open={!!userToEdit} onClose={() => setUserToEdit(null)} onUserUpdated={() => { setUserToEdit(null); fetchUsers(); }} userToEdit={userToEdit} />
            <Dialog open={!!userToDelete} onClose={() => setUserToDelete(null)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que quieres eliminar a "{userToDelete?.nombre_completo}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUserToDelete(null)}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default GestionUsuariosPage;