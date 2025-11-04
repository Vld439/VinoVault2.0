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
  MenuItem
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




  return (
    <Container maxWidth="xl">
      <Paper 
        elevation={4}
        sx={{ 
          p: 2, 
          mt: 4, 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          transition: 'background-color 0.3s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img src={logo} alt="Logo" style={{ height: '300px' }} />
          <div>
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
            {user && (
              <Typography variant="h6">
                Usuario: {user.nombre_completo} ({user.rol})
              </Typography>
            )}
          </div>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
              <Button component={RouterLink} to="/admin/usuarios" variant="contained" color="primary">
                Gestionar Usuarios
              </Button>
            )}
            <Button component={RouterLink} to="/clientes" variant="contained" color="primary">
                Gestionar Clientes
            </Button>
            <Button component={RouterLink} to="/historial" variant="contained" color="primary">
                Ver Historial
            </Button>
            <Button component={RouterLink} to="/reportes" variant="contained" color="primary">
                Ver Reportes
            </Button>
            <Button variant="contained" color="secondary" onClick={logout}>
                Cerrar Sesión
            </Button>
        </Box>
      </Paper>

      {stats && (
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
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
          <StatCard 
            title="Total de Clientes" 
            value={stats.totalClientes} 
            icon="people"
            color="#ed6c02"
          />
        </Box>
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Inventario de Productos
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => setIsAddModalOpen(true)}>
        <Icon>add</Icon>
      </Fab>
      <Fab
        color="secondary"
        aria-label="cart"
        sx={{ position: 'fixed', bottom: 32, left: 32 }}
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