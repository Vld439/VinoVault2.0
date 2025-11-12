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
  DialogTitle,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Divider
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
  
  // Para cambiar entre tabla y cards
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  // Card individual para vista móvil
  const ClientCard = ({ cliente }: { cliente: ClienteStats }) => (
    <Card sx={{ mb: 2, elevation: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {cliente.nombre}
          </Typography>
          <Chip 
            label={`${cliente.numero_de_compras} compras`} 
            color="primary" 
            size="small" 
          />
        </Box>
        
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon color="action" sx={{ fontSize: '1.2rem' }}>badge</Icon>
            <Typography variant="body2" color="text.secondary">
              RUC/C.I.: {cliente.ruc || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon color="action" sx={{ fontSize: '1.2rem' }}>contact_mail</Icon>
            <Typography variant="body2" color="text.secondary">
              {cliente.email || cliente.telefono || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon color="action" sx={{ fontSize: '1.2rem' }}>schedule</Icon>
            <Typography variant="body2" color="text.secondary">
              Cliente desde: {formatDate(cliente.fecha_registro)}
            </Typography>
          </Box>
          
          <Divider />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(cliente.gasto_total_usd, 'USD')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gasto total
            </Typography>
          </Box>
        </Stack>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          size="small" 
          component={RouterLink} 
          to={`/clientes/${cliente.id}`}
          variant="contained"
          startIcon={<Icon>person</Icon>}
        >
          Ver Perfil
        </Button>
        <Box>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => setClientToEdit(cliente)}
          >
            <Icon>edit</Icon>
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => setClientToDelete(cliente)}
          >
            <Icon>delete</Icon>
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        my: { xs: 2, md: 4 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1"
          sx={{ textAlign: { xs: 'center', sm: 'left' } }}
        >
          Gestión de Clientes
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button 
            variant="contained" 
            onClick={() => setIsAddClientModalOpen(true)}
            startIcon={<Icon>person_add</Icon>}
            fullWidth={isMobile}
          >
            Añadir Cliente
          </Button>
          <Button 
            component={RouterLink} 
            to="/dashboard" 
            variant="outlined"
            startIcon={<Icon>dashboard</Icon>}
            fullWidth={isMobile}
          >
            Volver al Dashboard
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Vista móvil con cards */}
          {isMobile ? (
            <Box>
              {clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <ClientCard key={cliente.id} cliente={cliente} />
                ))
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Icon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}>people_outline</Icon>
                  <Typography variant="h6" color="text.secondary">
                    No hay clientes registrados
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            // Vista desktop con tabla
            <Paper elevation={3}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>RUC / C.I.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cliente Desde</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">N° Compras</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Gasto Total (USD)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>{cliente.nombre}</TableCell>
                        <TableCell>{cliente.ruc || 'N/A'}</TableCell>
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
        </>
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