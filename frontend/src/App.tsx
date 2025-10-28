import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Snackbar, Alert, Box, Icon, Switch } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { useCustomTheme } from './context/ThemeContext';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import HistorialPage from './pages/Historial';
import GestionUsuariosPage from './pages/GestionUsuarios';
import GestionClientesPage from './pages/GestionClientes';
import PerfilClientePage from './pages/PerfilCliente';

function App() {
  const { notification, handleCloseNotification } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Interruptor de Tema fijo en la esquina superior derecha */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1301 }}>
        <Icon sx={{ verticalAlign: 'middle', color: 'text.secondary' }}>
          {mode === 'dark' ? 'dark_mode' : 'light_mode'}
        </Icon>
        <Switch 
          checked={mode === 'dark'} 
          onChange={toggleTheme} 
          color="primary"
        />
      </Box>

      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas Protegidas que requieren inicio de sesión */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path="/admin/usuarios" element={<GestionUsuariosPage />} />
            <Route path="/clientes" element={<GestionClientesPage />} />
            <Route path="/clientes/:id" element={<PerfilClientePage />} />
          </Route>

          {/* Ruta por defecto */}
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </Router>

      {/* Componente global para mostrar notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;