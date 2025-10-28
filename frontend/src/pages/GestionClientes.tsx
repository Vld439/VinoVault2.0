import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Button,
  IconButton,
  Icon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth, axiosInstance } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';

// Interfaz para el objeto Cliente con sus estadísticas
interface ClienteStats {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  ruc: string;
  fecha_registro: string;
  numero_de_compras: string;
  gasto_total_usd: string;
}

const GestionClientesPage = () => {
  const [clientes, setClientes] = useState<ClienteStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useAuth();

  // Estados para los modales
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClienteStats | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClienteStats | null>(null);

  const fetchClientes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      showNotification('No se pudo cargar la lista de clientes.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric'
      });
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await axiosInstance.delete(`/clientes/${clientToDelete.id}`);
      showNotification('Cliente eliminado.', 'success');
      setClientToDelete(null);
      fetchClientes();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Error al eliminar el cliente.', 'error');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">Gestión de Clientes</Typography>
        <Box>
            <Button variant="contained" onClick={() => setIsAddClientModalOpen(true)}>
                Añadir Cliente
            </Button>
            <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ ml: 2 }}>
                Volver al Dashboard
            </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : (
        <Paper elevation={3}>
            <TableContainer>
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cliente Desde</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">N° Compras</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Gasto Total (USD)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {clientes.map((cliente) => (
                    <TableRow key={cliente.id} hover>
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.email || cliente.telefono || 'N/A'}</TableCell>
                    <TableCell>{formatDate(cliente.fecha_registro)}</TableCell>
                    <TableCell align="center">{cliente.numero_de_compras}</TableCell>
                    <TableCell align="right">{formatCurrency(cliente.gasto_total_usd, 'USD')}</TableCell>
                    <TableCell align="right">
                        <Button size="small" component={RouterLink} to={`/clientes/${cliente.id}`}>
                            Ver Perfil
                        </Button>
                        <IconButton size="small" color="primary" sx={{ ml: 1 }} onClick={() => setClientToEdit(cliente)}>
                            <Icon>edit</Icon>
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setClientToDelete(cliente)}>
                            <Icon>delete</Icon>
                        </IconButton>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </Paper>
      )}

      <AddClientModal
        open={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={() => {
            fetchClientes(); // Refresca la lista después de añadir
            setIsAddClientModalOpen(false); // Cierra el modal
        }}
       />
      
      <EditClientModal
        open={!!clientToEdit}
        onClose={() => setClientToEdit(null)}
        onClientUpdated={() => {
          setClientToEdit(null);
          fetchClientes();
        }}
        clientToEdit={clientToEdit}
      />

      <Dialog open={!!clientToDelete} onClose={() => setClientToDelete(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar a "{clientToDelete?.nombre}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientToDelete(null)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" type="button">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionClientesPage;