import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { AlertColor } from '@mui/material';

// --- INTERFACES ---

interface User {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
}

interface DecodedToken {
  id: number;
  email: string;
  rol: string;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  notification: NotificationState;
  showNotification: (message: string, severity?: AlertColor) => void;
  handleCloseNotification: () => void;
}

// --- CONFIGURACIÓN DE AXIOS ---

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// --- CREACIÓN DEL CONTEXTO ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchUserData = async (currentToken: string) => {
      try {
        const decoded = jwtDecode<DecodedToken>(currentToken);
        const response = await axiosInstance.get(`/users/${decoded.id}`);
        setUser(response.data);
      } catch (error) {
        console.error("Token inválido o expirado, cerrando sesión.", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  const showNotification = (message: string, severity: AlertColor = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isLoading,
      login,
      logout,
      notification,
      showNotification,
      handleCloseNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};