import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Snackbar, Alert, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import HistorialPage from './pages/Historial';
import GestionUsuariosPage from './pages/GestionUsuarios';
import GestionClientesPage from './pages/GestionClientes';
import PerfilClientePage from './pages/PerfilCliente';
import ReportesPage from './pages/ReportesPage';

function App() {
  const { notification, handleCloseNotification } = useAuth();

  return (
    <Box sx={{ position: 'relative' }}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas que requieren inicio de sesión */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/historial" element={<HistorialPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/usuarios" element={<GestionUsuariosPage />} />
              </Route>
              <Route path="/clientes" element={<GestionClientesPage />} />
              <Route path="/clientes/:id" element={<PerfilClientePage />} />
            </Route>
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