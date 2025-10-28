import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/logo.png';

const API_URL = 'http://localhost:5001/api/auth/login';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, showNotification } = useAuth(); // Obtenemos la función para mostrar notificaciones

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await axios.post(API_URL, {
        email: email,
        contrasena: password,
      });
      
      login(response.data.token);
      
      navigate('/dashboard');

    } catch (err) {
      // En lugar de manejar un estado de error local, llamamos a la notificación global
      showNotification('Credenciales inválidas. Por favor, intenta de nuevo.', 'error');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={6}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <img src={logo} alt="VinoVault Logo" style={{ height: '400px' }} />
        </Box>

        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>
        
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Ingresar
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;