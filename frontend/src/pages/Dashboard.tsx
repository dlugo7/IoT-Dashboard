import React, { useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Alert,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  ThermostatAuto,
  WaterDrop,
  ElectricBolt,
  Security,
  WifiTethering,
  Sensors,
} from '@mui/icons-material';

// Enhanced Components
import StatsCard from '../components/Dashboard/StatsCard';
import SensorStatus from '../components/Dashboard/SensorStatus';
import RecentAlerts from '../components/Dashboard/RecentAlerts';

// Hooks
import { useDashboardStats, useSensors } from '../hooks/useSensorData';

// API Service for debug info
import apiService from '../services/api';

const Dashboard: React.FC = () => {
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: sensors = [], isLoading: sensorsLoading } = useSensors();

  // Calculate derived stats
  const activeSensors = sensors.filter(s => s.isActive);
  const offlineSensors = sensors.filter(s => !s.isActive);
  const uniqueLocations = new Set(sensors.map(s => s.location)).size;

  // Mock some trend data for demo
  const mockTrends = {
    totalSensors: { value: 5.2, direction: 'up' as const },
    activeSensors: { value: 2.1, direction: 'up' as const },
    offlineSensors: { value: -12.5, direction: 'down' as const },
    locations: { value: 0, direction: 'up' as const },
  };

  useEffect(() => {
    // In real app, this would initialize WebSocket connections
    // and set up real-time data subscriptions
    console.log('Dashboard mounted - Real-time connections would be initialized here');
    console.log('🔍 Dashboard Debug - API Service using mock data:', apiService.isUsingMockData());
  }, []);

  if (statsLoading || sensorsLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
        
        {/* Loading Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <StatsCard
                title="Loading..."
                value="--"
                icon={<Skeleton variant="circular" width={24} height={24} />}
                color="primary"
                isLoading={true}
              />
            </Grid>
          ))}
        </Grid>

        {/* Loading Content Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
        
        {/* Debug Information */}
        <Alert severity="info" sx={{ mb: 2 }}>
          🔍 Debug Info: API Service is using mock data: {apiService.isUsingMockData() ? 'YES' : 'NO'}
          <br />
          Environment: {import.meta.env.MODE}
          <br />
          API Endpoint: {import.meta.env.VITE_API_ENDPOINT || 'undefined'}
        </Alert>
        
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load dashboard data. Please check your connection and try again.
          <br />
          Error: {statsError?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Fade in timeout={600}>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
      </Fade>
      
      {/* Debug Information for Demo Mode */}
      {apiService.isUsingMockData() && (
        <Fade in timeout={400}>
          <Alert severity="info" sx={{ mb: 3 }}>
            🎭 Demo Mode: This dashboard is using realistic mock data for demonstration purposes.
            All sensors, alerts, and analytics are simulated but fully functional.
          </Alert>
        </Fade>
      )}
      
      {/* Stats Cards */}
      <Fade in timeout={800}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <StatsCard
              title="Total Sensors"
              value={sensors.length}
              icon={<Sensors color="primary" />}
              color="primary"
              trend={mockTrends.totalSensors}
              subtitle="Connected devices"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <StatsCard
              title="Active Sensors"
              value={activeSensors.length}
              icon={<WifiTethering color="success" />}
              color="success"
              trend={mockTrends.activeSensors}
              subtitle="Online now"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <StatsCard
              title="Offline Sensors"
              value={offlineSensors.length}
              icon={<WifiTethering color="error" />}
              color="error"
              trend={mockTrends.offlineSensors}
              subtitle="Need attention"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <StatsCard
              title="Locations"
              value={uniqueLocations}
              icon={<Security color="info" />}
              color="info"
              trend={mockTrends.locations}
              subtitle="Monitored areas"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <StatsCard
              title="Avg Temperature"
              value={dashboardStats?.averageTemperature ? `${dashboardStats.averageTemperature}°C` : '22.5°C'}
              icon={<ThermostatAuto color="warning" />}
              color="warning"
              trend={{ value: 1.2, direction: 'up' }}
              subtitle="Current average"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <StatsCard
              title="Energy Usage"
              value={dashboardStats?.energyConsumption ? `${dashboardStats.energyConsumption}W` : '2,847W'}
              icon={<ElectricBolt color="error" />}
              color="error"
              trend={{ value: -3.8, direction: 'down' }}
              subtitle="Current consumption"
            />
          </Grid>
        </Grid>
      </Fade>

      {/* Main Content */}
      <Fade in timeout={1000}>
        <Grid container spacing={3}>
          {/* Sensor Status Panel */}
          <Grid item xs={12} lg={8}>
            <SensorStatus 
              maxItems={8}
              showHeader={true}
            />
          </Grid>

          {/* Recent Alerts Panel */}
          <Grid item xs={12} lg={4}>
            <RecentAlerts 
              maxItems={6}
              showHeader={true}
              showAcknowledged={false}
            />
          </Grid>
        </Grid>
      </Fade>
    </Box>
  );
};

export default Dashboard; 