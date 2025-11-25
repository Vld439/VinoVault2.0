import { createContext, useState, useMemo, useContext, type ReactNode, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { type PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as PaletteMode;
    return savedMode || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
          // Premium Dark Wine Theme
          primary: { main: '#d4af37' }, // Gold
          secondary: { main: '#722f37' }, // Merlot
          background: {
            default: '#120b0d', // Deep Dark Wine/Black
            paper: '#1e1115',   // Dark Wine Surface
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#b0a0a0',
          },
        }
        : {
          // Light Mode (Optional fallback)
          primary: { main: '#722f37' },
          secondary: { main: '#d4af37' },
          background: {
            default: '#f5f0f0',
            paper: '#ffffff'
          },
          text: {
            primary: '#2c1810',
            secondary: '#5d4037'
          }
        }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
      h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
      h3: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
      h4: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
      h5: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
      h6: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? 'rgba(30, 17, 21, 0.7)' : '#ffffff',
            backdropFilter: 'blur(10px)',
            border: mode === 'dark' ? '1px solid rgba(212, 175, 55, 0.1)' : 'none',
            boxShadow: mode === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 4px 20px rgba(0,0,0,0.05)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '8px 24px',
          },
          containedPrimary: {
            background: mode === 'dark'
              ? 'linear-gradient(45deg, #d4af37 30%, #f9d976 90%)'
              : 'linear-gradient(45deg, #722f37 30%, #a54a56 90%)',
            color: mode === 'dark' ? '#120b0d' : '#ffffff',
            boxShadow: '0 3px 5px 2px rgba(212, 175, 55, .3)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(18, 11, 13, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
          }
        }
      }
    },
  }), [mode]);

  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useCustomTheme debe ser usado dentro de un CustomThemeProvider');
  }
  return context;
};