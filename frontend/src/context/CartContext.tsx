import { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface Product {
  id: number;
  nombre: string;
  precio_venta: string;
  total_stock: number;
  imagen_url?: string;
  precio_venta_pyg?: string;
  precio_venta_brl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Currency = 'USD' | 'PYG' | 'BRL';

interface CartContextType {
  cartItems: CartItem[];
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
 getCartSubtotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>('USD');
  const { showNotification } = useAuth();

  const addToCart = useCallback((product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.total_stock) {
          showNotification('No hay más stock disponible para este producto.', 'warning');
          return prevItems;
        }
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.total_stock > 0) {
        return [...prevItems, { ...product, quantity: 1 }];
      } else {
        showNotification('Este producto no tiene stock disponible.', 'warning');
        return prevItems;
      }
    });
  }, [showNotification]);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateCartItemQuantity = useCallback((productId: number, quantity: number) => {
    setCartItems(prevItems => {
      const itemToUpdate = prevItems.find(item => item.id === productId);
      if (itemToUpdate && quantity > itemToUpdate.total_stock) {
        showNotification('No se puede seleccionar una cantidad mayor al stock disponible.', 'warning');
        return prevItems;
      }
      if (quantity <= 0) {
        return prevItems.filter(item => item.id !== productId);
      }
      return prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  }, [showNotification]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartSubtotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      let price = parseFloat(item.precio_venta);
      if (currency === 'PYG' && item.precio_venta_pyg) {
        price = parseFloat(item.precio_venta_pyg);
      } else if (currency === 'BRL' && item.precio_venta_brl) {
        price = parseFloat(item.precio_venta_brl);
      }
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems, currency]);

  const getCartItemCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const contextValue = useMemo(() => ({
    cartItems,
    currency,
    setCurrency,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
   getCartSubtotal,
    getCartItemCount
  }), [cartItems, currency, addToCart, removeFromCart, updateCartItemQuantity, clearCart,getCartSubtotal, getCartItemCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};