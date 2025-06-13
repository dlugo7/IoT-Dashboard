import React, { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './store/themeStore';

// Components
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Create theme factory
const createAppTheme = (isDarkMode: boolean) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: isDarkMode ? '#121212' : '#f5f5f5',
      paper: isDarkMode ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: isDarkMode ? '#ffffff' : '#000000',
      secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: isDarkMode 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.1)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Create query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes - shorter for more real-time feel
      gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer (renamed from cacheTime in v4)
      refetchOnWindowFocus: false,
              refetchOnMount: 'always', // Always refetch on mount for fresh data
        // Enable background refetching for better UX
        refetchInterval: false, // Disable automatic refetching by default
        refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      // Optimistic updates for better perceived performance
      onMutate: () => {
        // Could add global loading state here
      },
    },
  },
});

function App() {
  const { isDarkMode, initializeTheme } = useThemeStore();
  
  // Initialize theme on app start
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(isDarkMode), [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sensors" element={<Sensors />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </Router>
        </Box>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 