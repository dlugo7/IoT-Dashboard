import React, { useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  ThermostatAuto,
  WaterDrop,
  ElectricBolt,
  Security,
  WifiTethering,
  Battery3Bar,
} from '@mui/icons-material';

// Components
import StatsCard from '../components/Dashboard/StatsCard';

// Mock data - In real app, this would come from the store
const mockStats = {
  totalSensors: 12,
  activeSensors: 10,
  averageTemperature: 22.5,
  averageHumidity: 45,
  motionDetections: 8,
  energyConsumption: 2847,
};

const mockSensors = [
  {
    sensorId: 'temp-001',
    name: 'Living Room Temperature',
    sensorType: 'temperature' as const,
    location: 'Living Room',
    value: 22.5,
    unit: '°C',
    status: 'online' as const,
    batteryLevel: 85,
    lastSeen: '2 min ago',
  },
  {
    sensorId: 'humid-001',
    name: 'Kitchen Humidity',
    sensorType: 'humidity' as const,
    location: 'Kitchen',
    value: 48,
    unit: '%',
    status: 'online' as const,
    batteryLevel: 92,
    lastSeen: '1 min ago',
  },
  {
    sensorId: 'motion-001',
    name: 'Front Door Motion',
    sensorType: 'motion' as const,
    location: 'Entrance',
    value: 1,
    unit: 'detected',
    status: 'warning' as const,
    batteryLevel: 15,
    lastSeen: '5 min ago',
  },
  {
    sensorId: 'power-001',
    name: 'Main Power Monitor',
    sensorType: 'power' as const,
    location: 'Utility Room',
    value: 2847,
    unit: 'W',
    status: 'online' as const,
    batteryLevel: 100,
    lastSeen: '30 sec ago',
  },
];

const mockAlerts = [
  {
    id: 'alert-001',
    sensorId: 'motion-001',
    sensorName: 'Front Door Motion',
    alertType: 'battery_low' as const,
    message: 'Battery level below 20%',
    severity: 'high' as const,
    timestamp: '2024-01-15T10:25:00Z',
    acknowledged: false,
  },
  {
    id: 'alert-002',
    sensorId: 'temp-001',
    sensorName: 'Living Room Temperature',
    alertType: 'threshold_exceeded' as const,
    message: 'Temperature above comfort zone',
    severity: 'medium' as const,
    timestamp: '2024-01-15T09:45:00Z',
    acknowledged: false,
  },
];

const Dashboard: React.FC = () => {
  useEffect(() => {
    // In real app, this would initialize WebSocket connections
    // and fetch initial data
    console.log('Dashboard mounted');
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'warning':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <ThermostatAuto />;
      case 'humidity':
        return <WaterDrop />;
      case 'power':
        return <ElectricBolt />;
      case 'motion':
        return <Security />;
      default:
        return <WifiTethering />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Total Sensors"
            value={mockStats.totalSensors}
            icon={<WifiTethering color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Active Sensors"
            value={mockStats.activeSensors}
            icon={<WifiTethering color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Avg Temperature"
            value={`${mockStats.averageTemperature}°C`}
            icon={<ThermostatAuto color="info" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Avg Humidity"
            value={`${mockStats.averageHumidity}%`}
            icon={<WaterDrop color="info" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Motion Events"
            value={mockStats.motionDetections}
            icon={<Security color="warning" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Power Usage"
            value={`${mockStats.energyConsumption}W`}
            icon={<ElectricBolt color="error" />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sensor Status Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sensor Status
              </Typography>
              {mockSensors.map((sensor) => (
                <Box key={sensor.sensorId} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getSensorIcon(sensor.sensorType)}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="subtitle2">{sensor.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sensor.location}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6">
                        {sensor.value} {sensor.unit}
                      </Typography>
                      <Chip
                        label={sensor.status}
                        color={getStatusColor(sensor.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  {/* Battery Level */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Battery3Bar
                      sx={{ 
                        mr: 1, 
                        color: sensor.batteryLevel < 20 ? 'error.main' : 'text.secondary' 
                      }}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={sensor.batteryLevel}
                      sx={{ flexGrow: 1, mr: 1 }}
                      color={sensor.batteryLevel < 20 ? 'error' : 'primary'}
                    />
                    <Typography variant="caption">
                      {sensor.batteryLevel}%
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Last seen: {sensor.lastSeen}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              {mockAlerts.length === 0 ? (
                <Typography color="text.secondary">
                  No recent alerts
                </Typography>
              ) : (
                mockAlerts.map((alert) => (
                  <Box key={alert.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={alert.severity}
                        color={alert.severity === 'high' ? 'error' : 'warning'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {alert.sensorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Temperature Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Temperature Trends (Last 24 Hours)
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  Chart component will be implemented here with real-time data
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 