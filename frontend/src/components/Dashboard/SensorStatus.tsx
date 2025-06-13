import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Skeleton,
  Collapse,
  Button,
  Divider,
} from '@mui/material';
import {
  ThermostatAuto,
  WaterDrop,
  Security,
  ElectricBolt,
  Lightbulb,
  Air,
  Sensors as SensorIcon,
  MoreVert,
  Circle,
  Warning,
  Error,
  CheckCircle,
  WifiOff,
  Battery1Bar,
  Battery3Bar,
  BatteryFull,
  Refresh,
  Settings,
  Delete,
  Edit,
  ExpandMore,
  ExpandLess,
  SignalWifi4Bar,
  SignalWifiOff,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useSensors } from '../../hooks/useSensorData';
import { SensorConfig, SensorType } from '../../types/sensor';

// Mock real-time sensor data
const mockSensorData = {
  'temp-001': { value: 22.5, unit: '°C', batteryLevel: 85 },
  'humid-001': { value: 48, unit: '%', batteryLevel: 92 },
  'motion-001': { value: 1, unit: 'detected', batteryLevel: 15 },
  'power-001': { value: 2847, unit: 'W', batteryLevel: 100 },
};

interface SensorStatusProps {
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

const SensorStatus: React.FC<SensorStatusProps> = ({ 
  maxItems = 10, 
  showHeader = true,
  compact = false 
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { data: sensors = [], isLoading, refetch } = useSensors();

  const getSensorIcon = (type: SensorType) => {
    const iconProps = { fontSize: 'small' as const };
    switch (type) {
      case 'temperature': return <ThermostatAuto {...iconProps} />;
      case 'humidity': return <WaterDrop {...iconProps} />;
      case 'motion': return <Security {...iconProps} />;
      case 'power': return <ElectricBolt {...iconProps} />;
      case 'light': return <Lightbulb {...iconProps} />;
      case 'air_quality': return <Air {...iconProps} />;
      default: return <SensorIcon {...iconProps} />;
    }
  };

  const getSensorColor = (type: SensorType) => {
    switch (type) {
      case 'temperature': return '#ff7043';
      case 'humidity': return '#26c6da';
      case 'motion': return '#ab47bc';
      case 'power': return '#ffa726';
      case 'light': return '#ffee58';
      case 'air_quality': return '#66bb6a';
      default: return theme.palette.primary.main;
    }
  };

  const getStatusInfo = (sensor: SensorConfig) => {
    const mockData = mockSensorData[sensor.sensorId as keyof typeof mockSensorData];
    const timeSinceLastSeen = Date.now() - new Date(sensor.lastSeen).getTime();
    const minutesAgo = timeSinceLastSeen / (1000 * 60);

    let status: 'online' | 'warning' | 'offline' | 'error' = 'online';
    let statusText = 'Online';
    let statusColor = 'success';

    if (!sensor.isActive) {
      status = 'offline';
      statusText = 'Offline';
      statusColor = 'error';
    } else if (mockData?.batteryLevel && mockData.batteryLevel < 20) {
      status = 'warning';
      statusText = 'Low Battery';
      statusColor = 'warning';
    } else if (minutesAgo > 30) {
      status = 'warning';
      statusText = 'Connection Issues';
      statusColor = 'warning';
    }

    return { status, statusText, statusColor, mockData };
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return null;
    if (level > 60) return <BatteryFull color="success" fontSize="small" />;
    if (level > 20) return <Battery3Bar color="warning" fontSize="small" />;
    return <Battery1Bar color="error" fontSize="small" />;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sensorId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedSensor(sensorId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSensor(null);
  };

  const displaySensors = expanded ? sensors : sensors.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader
            title={<Skeleton variant="text" width="60%" />}
            action={<Skeleton variant="circular" width={24} height={24} />}
          />
        )}
        <CardContent>
          <List>
            {[...Array(4)].map((_, index) => (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="70%" />}
                  secondary={<Skeleton variant="text" width="50%" />}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      {showHeader && (
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="h6">Sensor Status</Typography>
              <Badge
                badgeContent={sensors.filter(s => s.isActive).length}
                color="success"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: 18,
                    minWidth: 18,
                  },
                }}
              >
                <SensorIcon fontSize="small" />
              </Badge>
            </Box>
          }
          action={
            <Tooltip title="Refresh sensors">
              <IconButton size="small" onClick={() => refetch()}>
                <Refresh />
              </IconButton>
            </Tooltip>
          }
        />
      )}
      
      <CardContent sx={{ pt: showHeader ? 0 : 2 }}>
        {sensors.length === 0 ? (
          <Box textAlign="center" py={4}>
            <SensorIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No sensors connected
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Add sensors to start monitoring your environment
      </Typography>
    </Box>
        ) : (
          <>
            <List sx={{ py: 0 }}>
              {displaySensors.map((sensor, index) => {
                const { status, statusText, statusColor, mockData } = getStatusInfo(sensor);
                const sensorColor = getSensorColor(sensor.sensorType);

                return (
                  <ListItem
                    key={sensor.sensorId}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(sensorColor, 0.05),
                        transform: 'translateX(4px)',
                      },
                      animation: `fadeInSlide 0.6s ease-out ${index * 0.1}s both`,
                      '@keyframes fadeInSlide': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(20px)',
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                    secondaryAction={
                      <Box display="flex" alignItems="center" gap={1}>
                        {mockData?.batteryLevel && getBatteryIcon(mockData.batteryLevel)}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, sensor.sensorId)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          status === 'online' ? (
                            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                          ) : status === 'warning' ? (
                            <Warning sx={{ fontSize: 14, color: 'warning.main' }} />
                          ) : (
                            <Error sx={{ fontSize: 14, color: 'error.main' }} />
                          )
                        }
                      >
                        <Avatar
                          sx={{
                            background: `linear-gradient(135deg, ${sensorColor}, ${alpha(sensorColor, 0.7)})`,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getSensorIcon(sensor.sensorType)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {sensor.name}
                          </Typography>
                          <Chip
                            label={statusText}
                            size="small"
                            color={statusColor as any}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            {sensor.location} • {formatDistanceToNow(new Date(sensor.lastSeen), { addSuffix: true })}
                          </Typography>
                          {mockData && (
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Typography variant="body2" fontWeight={600}>
                                {mockData.value} {mockData.unit}
                              </Typography>
                              {mockData.batteryLevel && (
                                <>
                                  <Typography variant="caption" color="textSecondary">
                                    •
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color={
                                      mockData.batteryLevel > 60 ? 'success.main' :
                                      mockData.batteryLevel > 20 ? 'warning.main' : 'error.main'
                                    }
                                  >
                                    {mockData.batteryLevel}% battery
                                  </Typography>
                                </>
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            {sensors.length > maxItems && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box textAlign="center">
                  <Button
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                  >
                    {expanded ? 'Show Less' : `Show ${sensors.length - maxItems} More`}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Sensor
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Remove Sensor
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default SensorStatus; 