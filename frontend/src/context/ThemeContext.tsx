import { createContext, useState, useMemo, useContext, type ReactNode, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { type PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
            primary: { main: '#90caf9' },
            secondary: { main: '#673ab7' },
            background: { default: '#121212', paper: '#1e1e1e' },
          }
        : {
            primary: { main: '#4ca3eaff' },
            secondary: { main: '#D4AF37' },
            background: { 
                default: '#FFF8E1',
                paper: '#FFFFFF'
            },
            text: {
                primary: '#424242',
                secondary: '#616161'
            }
          }),
    },
    shape: {
        borderRadius: 8,
    },
  }), [mode]);  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

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