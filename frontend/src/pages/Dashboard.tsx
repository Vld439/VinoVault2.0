import { useEffect, useState, useCallback } from 'react';
import { useAuth, axiosInstance } from '../context/AuthContext';
import { useCart, type Currency } from '../context/CartContext';
import { useCustomTheme } from '../context/ThemeContext';
import {
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Fab,
  Icon,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import EditImageModal from '../components/EditImageModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ProductDetailModal from '../components/ProductDetailModal';
import EditProductModal from '../components/EditProductModal';
import CheckoutModal from '../components/CheckoutModal';
import logo from '../assets/logo.png';
import { formatCurrency } from '../utils/formatCurrency';

interface Product {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  imagen_url?: string;
  total_stock: number;
  precio_venta_pyg?: string;
  precio_venta_brl?: string;
}

interface DashboardStats {
  valorInventario: { usd: string; pyg: string; brl: string; };
  ventasHoy: { usd: string; pyg: string; brl: string; };
  totalProductos: string;
  totalClientes: string;
}

const DashboardPage = () => {
  const { user, logout, showNotification } = useAuth();
  const { cartItems, addToCart, getCartItemCount, currency, setCurrency } = useCart();
  useCustomTheme();
  
  // Para detectar si estamos en móvil o tablet
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEditImage, setProductToEditImage] = useState<Product | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsRes, statsRes] = await Promise.all([
        axiosInstance.get('/productos'),
        axiosInstance.get('/dashboard/stats')
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      showNotification('No se pudieron cargar los datos del dashboard.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = products.filter(product =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleCloseDeleteDialog = useCallback(() => setProductToDelete(null), []);
  
  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return;
    try {
      await axiosInstance.delete(`/productos/${productToDelete.id}`);
      handleCloseDeleteDialog();
      fetchData();
      showNotification('Producto eliminado exitosamente.', 'success');
    } catch (err) {
      showNotification('Error al eliminar el producto.', 'error');
    }
  }, [productToDelete, fetchData, showNotification, handleCloseDeleteDialog]);




  // Opciones del menú móvil
  const navigationItems = [
    { text: 'Gestionar Clientes', to: '/clientes', icon: 'people' },
    { text: 'Ver Historial', to: '/historial', icon: 'history' },
    { text: 'Ver Reportes', to: '/reportes', icon: 'assessment' },
    ...(user?.rol === 'admin' ? [{ text: 'Gestionar Usuarios', to: '/admin/usuarios', icon: 'admin_panel_settings' }] : []),
  ];

  return (
    <Container maxWidth="xl">
      <Paper 
        elevation={4}
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mt: { xs: 2, sm: 4 }, 
          mb: { xs: 2, sm: 4 }, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 0 },
          transition: 'background-color 0.3s',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
          justifyContent: { xs: 'center', md: 'flex-start' }
        }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              // Logo más pequeño en móviles
              height: isMobile ? '150px' : isTablet ? '200px' : '300px',
              objectFit: 'contain'
            }} 
          />
          <div>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1"
              sx={{ textAlign: { xs: 'center', md: 'left' } }}
            >
              Dashboard
            </Typography>
            {user && (
              <Typography 
                variant={isMobile ? "body1" : "h6"}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                Usuario: {user.nombre_completo} ({user.rol})
              </Typography>
            )}
          </div>
        </Box>

        {/* Navegación completa solo en desktop */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Moneda</InputLabel>
              <Select
                value={currency}
                label="Moneda"
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="PYG">PYG</MenuItem>
                <MenuItem value="BRL">BRL</MenuItem>
              </Select>
            </FormControl>
            {user?.rol === 'admin' && (
              <Button component={RouterLink} to="/admin/usuarios" variant="contained" color="primary" size="small">
                Gestionar Usuarios
              </Button>
            )}
            <Button component={RouterLink} to="/clientes" variant="contained" color="primary" size="small">
              Gestionar Clientes
            </Button>
            <Button component={RouterLink} to="/historial" variant="contained" color="primary" size="small">
              Ver Historial
            </Button>
            <Button component={RouterLink} to="/reportes" variant="contained" color="primary" size="small">
              Ver Reportes
            </Button>
            <Button variant="contained" color="secondary" onClick={logout} size="small">
              Cerrar Sesión
            </Button>
          </Box>
        )}

        {/* Navegación compacta para móviles */}
        {isMobile && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Moneda</InputLabel>
              <Select
                value={currency}
                label="Moneda"
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="PYG">PYG</MenuItem>
                <MenuItem value="BRL">BRL</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton 
              onClick={() => setMobileMenuOpen(true)}
              color="primary"
            >
              <Icon>menu</Icon>
            </IconButton>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={logout}
              size="small"
              startIcon={<Icon>logout</Icon>}
            >
              Salir
            </Button>
          </Stack>
        )}
      </Paper>

      {/* Menú lateral para móviles */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 'bold' }}>
            Navegación
          </Typography>
          <Divider />
          <List>
            {navigationItems.map((item) => (
              <ListItem 
                key={item.to}
                component={RouterLink} 
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                sx={{ 
                  color: 'inherit', 
                  textDecoration: 'none',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Icon sx={{ mr: 2, color: 'primary.main' }}>{item.icon}</Icon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Cards de estadísticas adaptables */}
      {stats && (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)'
          },
          gap: { xs: 2, sm: 3 },
          mb: 4 
        }}>
          <StatCard 
            title="Ventas de Hoy" 
            value={formatCurrency(stats.ventasHoy[currency.toLowerCase() as keyof typeof stats.ventasHoy], currency)} 
            icon="monetization_on"
            color="#2e7d32"
          />
          <StatCard 
            title="Total de Productos" 
            value={stats.totalProductos}
            icon="wine_bar"
            color="#d32f2f"
          />
          <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1', md: '3' } }}>
            <StatCard 
              title="Total de Clientes" 
              value={stats.totalClientes} 
              icon="people"
              color="#ed6c02"
            />
          </Box>
        </Box>
      )}

      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        sx={{ 
          mb: 2,
          fontWeight: 'bold',
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Inventario de Productos
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size={isMobile ? "small" : "medium"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon>search</Icon>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading && !stats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress size={60} /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={setProductToDelete}
                onEditImage={setProductToEditImage}
                onPreviewImage={setPreviewImageUrl}
                onViewDetails={setSelectedProduct}
                onEdit={setProductToEdit}
                onAddToCart={addToCart}
              />
            ))
          ) : (
            <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'text.secondary' }}>
              No se encontraron productos que coincidan con la búsqueda.
            </Typography>
          )}
        </Box>
      )}

      {/* Botones flotantes adaptativos */}
      <Fab 
        color="primary" 
        aria-label="add" 
        size={isMobile ? "medium" : "large"}
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 16, sm: 32 }, 
          right: { xs: 16, sm: 32 },
          zIndex: 1000
        }} 
        onClick={() => setIsAddModalOpen(true)}
      >
        <Icon>add</Icon>
      </Fab>
      
      <Fab
        color="secondary"
        aria-label="cart"
        size={isMobile ? "medium" : "large"}
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 80, sm: 96 }, 
          right: { xs: 16, sm: 32 },
          zIndex: 1000
        }}
        onClick={() => setIsCheckoutOpen(true)}
        disabled={cartItems.length === 0}
      >
        <Badge badgeContent={getCartItemCount()} color="error">
          <Icon>shopping_cart</Icon>
        </Badge>
      </Fab>

      <AddProductModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProductAdded={fetchData} />
      <CheckoutModal open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} onSaleComplete={fetchData} />
      <EditProductModal open={!!productToEdit} onClose={() => setProductToEdit(null)} onProductUpdated={fetchData} productToEdit={productToEdit} />
      <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      <ProductDetailModal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} productId={selectedProduct?.id || null} onStockUpdated={fetchData} />
      <EditImageModal open={!!productToEditImage} onClose={() => setProductToEditImage(null)} onImageUpdated={fetchData} product={productToEditImage}/>
      
      <Dialog open={!!productToDelete} onClose={() => setProductToDelete(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar "{productToDelete?.nombre}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductToDelete(null)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" type="button">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardPage;