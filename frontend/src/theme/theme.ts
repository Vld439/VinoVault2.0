// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Azul claro para acentos
    },
    background: {
      default: '#121212', // Fondo principal
      paper: '#1e1e1e',   // Fondo de las "tarjetas"
    },
  },
});