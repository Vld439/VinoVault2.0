import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button,
  Icon,
  IconButton
} from '@mui/material';
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

interface ProductCardProps {
  product: Product;
  onDelete: (product: Product) => void;
  onEditImage: (product: Product) => void;
  onPreviewImage: (imageUrl: string) => void;
  onViewDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onDelete, onEditImage, onPreviewImage, onViewDetails, onEdit, onAddToCart }: ProductCardProps) => {
  const imageUrl = product.imagen_url
    ? `${import.meta.env.VITE_API_BASE_URL}/${product.imagen_url}`
    : null;
console.log('Datos recibidos por ProductCard:', product);
  return (
    <Box
      sx={{
        padding: 1.5,
        width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' }
      }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative' }}>
          {imageUrl ? (
            <>
              <CardMedia
                component="img"
                height="200"
                image={imageUrl}
                alt={product.nombre}
                sx={{ objectFit: 'contain', p: 2, bgcolor: '#ffffff', cursor: 'pointer' }}
                onClick={() => onPreviewImage(imageUrl)}
              />
              <IconButton
                size="small"
                onClick={() => onEditImage(product)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  }
                }}
              >
                <Icon>edit</Icon>
              </IconButton>
            </>
          ) : (
            <Box
              sx={{
                height: 200, display: 'flex', alignItems: 'center',
                justifyContent: 'center', bgcolor: 'grey.200', cursor: 'pointer'
              }}
              onClick={() => onEditImage(product)}
            >
              <Icon sx={{ fontSize: 40, color: 'grey.600' }}>add_photo_alternate</Icon>
            </Box>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div">
            {product.nombre}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <Icon sx={{ color: product.total_stock > 0 ? 'success.main' : 'error.main', mr: 1 }}>
              {product.total_stock > 0 ? 'inventory_2' : 'warning'}
            </Icon>
            <Typography
              variant="h6"
              color={product.total_stock > 0 ? 'text.primary' : 'error.main'}
            >
              Stock: {product.total_stock}
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(product.precio_venta, 'USD')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(product.precio_venta_pyg || 0, 'PYG')} / {formatCurrency(product.precio_venta_brl || 0, 'BRL')}
            </Typography>
          </Box>
          
        </CardContent>
        <CardActions>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onAddToCart(product)}
            disabled={product.total_stock === 0}
          >
            Añadir al Carrito
          </Button>
        </CardActions>
        <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
          <Box>
            <Button size="small" onClick={() => onViewDetails(product)}>
              Detalles
            </Button>
            <Button size="small" sx={{ ml: 1 }} onClick={() => onEdit(product)}>
              Editar
            </Button>
          </Box>
          <IconButton size="small" color="error" onClick={() => onDelete(product)}>
            <Icon>delete</Icon>
          </IconButton>
        </CardActions>
      </Card>
    </Box>
  );
};

export default ProductCard;