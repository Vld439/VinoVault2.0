
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import CssBaseline from '@mui/material/CssBaseline';

// Importamos ambos proveedores
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { CustomThemeProvider } from './context/ThemeContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
 
     <CustomThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </CustomThemeProvider>
);