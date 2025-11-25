import { useEffect, useState, useCallback } from 'react';
import { useAuth, axiosInstance } from '../context/AuthContext';
import { useCart, type Currency } from '../context/CartContext';
import { useCustomTheme } from '../context/ThemeContext';
import {
  Container,
  Typography,
  Button,
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
} from '@mui/material';
import StatCard from '../components/StatCard';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import EditImageModal from '../components/EditImageModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ProductDetailModal from '../components/ProductDetailModal';
import EditProductModal from '../components/EditProductModal';
import CheckoutModal from '../components/CheckoutModal';
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
  const { user, showNotification } = useAuth();
  const { cartItems, addToCart, getCartItemCount, currency, setCurrency } = useCart();
  useCustomTheme();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: 'primary.main' }}>
            Dashboard
          </Typography>
          {user && (
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Bienvenido, {user.nombre_completo}
            </Typography>
          )}
        </Box>

        <FormControl size="small" sx={{ minWidth: 120 }}>
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
      </Box>

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
          textAlign: { xs: 'center', sm: 'left' },
          fontFamily: 'Playfair Display'
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
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            }
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
      <EditImageModal open={!!productToEditImage} onClose={() => setProductToEditImage(null)} onImageUpdated={fetchData} product={productToEditImage} />

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