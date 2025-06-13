import React, { useState, ReactNode } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  Link,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Sensors as SensorsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  WifiTethering as ConnectionIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePrefetch } from '../../hooks/usePrefetch';

interface LayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Sensors', icon: <SensorsIcon />, path: '/sensors' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { prefetchDashboard, prefetchSensorsPage, prefetchAnalytics } = usePrefetch();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handlePrefetch = (path: string) => {
    switch (path) {
      case '/dashboard':
        prefetchDashboard();
        break;
      case '/sensors':
        prefetchSensorsPage();
        break;
      case '/analytics':
        prefetchAnalytics();
        break;
      default:
        break;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SensorsIcon color="primary" />
          <Typography variant="h6" noWrap component="div" color="primary">
            IoT Dashboard
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              onMouseEnter={() => handlePrefetch(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Updated Header with Professional Signature */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" noWrap component="div">
              Smart Home Monitor
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 300,
                display: { xs: 'none', md: 'block' }
              }}
            >
              | A project by Daniel Lugo
            </Typography>
          </Box>
          
          {/* Connection Status */}
          <Chip
            icon={<ConnectionIcon />}
            label="Connected"
            color="success"
            variant="outlined"
            size="small"
            sx={{ mr: 2 }}
          />
          
          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="navigation"
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: '64px', // Height of AppBar
          }}
        >
          {children}
        </Box>
      </Box>
      
      {/* Professional Footer Signature */}
      <Box
        component="footer"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          py: 2,
          px: 3,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon color="primary" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            Developed by{' '}
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              Daniel Lugo
            </Typography>
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Full-Stack IoT Dashboard • React • TypeScript • AWS • Material-UI
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout; 