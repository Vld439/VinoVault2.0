import { useState } from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, IconButton, AppBar, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import WineBarIcon from '@mui/icons-material/WineBar';

const drawerWidth = 260;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Historial', icon: <InventoryIcon />, path: '/historial' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/usuarios' },
];

const Layout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, toggleTheme } = useCustomTheme();
    const { logout, user } = useAuth();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: mode === 'dark'
                ? 'linear-gradient(180deg, rgba(30,17,21,0.95) 0%, rgba(18,11,13,0.98) 100%)'
                : '#ffffff',
            backdropFilter: 'blur(10px)',
        }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <WineBarIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: 'text.primary' }}>
                    VinoVault
                </Typography>
            </Box>

            <List sx={{ flexGrow: 1, px: 2 }}>
                {menuItems.filter(item => item.text !== 'Usuarios' || user?.rol === 'admin').map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItemButton
                            key={item.text}
                            onClick={() => handleNavigation(item.path)}
                            sx={{
                                mb: 1,
                                borderRadius: 2,
                                backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                borderLeft: isActive ? '4px solid #d4af37' : '4px solid transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'text.primary' : 'text.secondary'
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <ExitToAppIcon />
                    </ListItemIcon>
                    <ListItemText primary="Cerrar Sesión" />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={toggleTheme}
                        sx={{
                            color: mode === 'dark' ? 'white' : 'primary.main',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255,255,255,0.05)' },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: 8
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
