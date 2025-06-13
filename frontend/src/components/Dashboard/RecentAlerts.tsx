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
  Button,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Skeleton,
  Collapse,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Notifications,
  Warning,
  Error,
  Info,
  Battery1Bar,
  ThermostatAuto,
  Security,
  CheckCircle,
  MoreVert,
  MarkEmailRead,
  Delete,
  Refresh,
  ExpandMore,
  ExpandLess,
  NotificationsActive,
  NotificationsOff,
  Circle,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAlerts } from '../../hooks/useSensorData';
import { Alert, AlertSeverity, AlertType } from '../../types/sensor';

// Mock additional alerts for demonstration
const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    sensorId: 'motion-001',
    sensorName: 'Front Door Motion',
    type: 'warning',
    alertType: 'battery_low',
    message: 'Battery level critically low (15%)',
    severity: 'high',
    priority: 'high',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    acknowledged: false,
  },
  {
    id: 'alert-002',
    sensorId: 'temp-001',
    sensorName: 'Living Room Temperature',
    type: 'warning',
    alertType: 'threshold_exceeded',
    message: 'Temperature above comfort zone (26.5°C)',
    severity: 'medium',
    priority: 'medium',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    acknowledged: false,
  },
  {
    id: 'alert-003',
    sensorId: 'motion-002',
    sensorName: 'Back Door Motion',
    type: 'info',
    alertType: 'motion_detected',
    message: 'Motion detected at unusual hours',
    severity: 'medium',
    priority: 'medium',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    acknowledged: true,
  },
  {
    id: 'alert-004',
    sensorId: 'humid-001',
    sensorName: 'Kitchen Humidity',
    type: 'error',
    alertType: 'sensor_offline',
    message: 'Sensor lost connection',
    severity: 'low',
    priority: 'low',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    acknowledged: true,
  },
];

interface RecentAlertsProps {
  maxItems?: number;
  showHeader?: boolean;
  showAcknowledged?: boolean;
}

const RecentAlerts: React.FC<RecentAlertsProps> = ({ 
  maxItems = 5, 
  showHeader = true,
  showAcknowledged = false 
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  // Use mock data for now - in real app would use: const { data: alerts = [], isLoading } = useAlerts();
  const alerts = mockAlerts;
  const isLoading = false;

  const getAlertIcon = (type?: AlertType, severity?: AlertSeverity) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'battery_low':
        return <Battery1Bar {...iconProps} />;
      case 'threshold_exceeded':
        return <ThermostatAuto {...iconProps} />;
      case 'motion_detected':
        return <Security {...iconProps} />;
      case 'sensor_offline':
        return <NotificationsOff {...iconProps} />;
      default:
        return severity === 'high' ? <Error {...iconProps} /> : 
               severity === 'medium' ? <Warning {...iconProps} /> : 
               <Info {...iconProps} />;
    }
  };

  const getSeverityColor = (severity?: AlertSeverity) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return theme.palette.primary.main;
    }
  };

  const getSeverityText = (severity?: AlertSeverity) => {
    return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'Unknown';
  };

  const getAlertTypeText = (type?: AlertType) => {
    switch (type) {
      case 'battery_low': return 'Low Battery';
      case 'threshold_exceeded': return 'Threshold Alert';
      case 'motion_detected': return 'Motion Alert';
      case 'sensor_offline': return 'Offline Sensor';
      case 'door_opened': return 'Door Alert';
      default: return 'System Alert';
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, alertId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlert(alertId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlert(null);
  };

  const handleAcknowledge = (alertId: string) => {
    // In real app: acknowledgeAlert.mutate(alertId);
    console.log('Acknowledging alert:', alertId);
    handleMenuClose();
  };

  const handleDelete = (alertId: string) => {
    // In real app: deleteAlert.mutate(alertId);
    console.log('Deleting alert:', alertId);
    handleMenuClose();
  };

  const filteredAlerts = showAcknowledged 
    ? alerts 
    : alerts.filter(alert => !alert.acknowledged);

  const displayAlerts = expanded ? filteredAlerts : filteredAlerts.slice(0, maxItems);
  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

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
            {[...Array(3)].map((_, index) => (
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
              <Typography variant="h6">Recent Alerts</Typography>
              {unacknowledgedCount > 0 && (
                <Badge
                  badgeContent={unacknowledgedCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: 18,
                      minWidth: 18,
                      animation: unacknowledgedCount > 0 ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    },
                  }}
                >
                  <NotificationsActive fontSize="small" />
                </Badge>
              )}
            </Box>
          }
          action={
            <Tooltip title="Refresh alerts">
              <IconButton size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          }
        />
      )}
      
      <CardContent sx={{ pt: showHeader ? 0 : 2 }}>
        {alerts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              All Clear!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No active alerts at this time
            </Typography>
          </Box>
        ) : filteredAlerts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Unacknowledged Alerts
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All alerts have been acknowledged
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ py: 0 }}>
              {displayAlerts.map((alert, index) => {
                const severityColor = getSeverityColor(alert.severity);
                const isUnacknowledged = !alert.acknowledged;

                return (
                  <ListItem
                    key={alert.id}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      opacity: alert.acknowledged ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(severityColor, 0.05),
                        transform: 'translateX(4px)',
                      },
                      animation: `fadeInSlide 0.6s ease-out ${index * 0.1}s both`,
                      '@keyframes fadeInSlide': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(20px)',
                        },
                        '100%': {
                          opacity: alert.acknowledged ? 0.7 : 1,
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                    secondaryAction={
                      <Box display="flex" alignItems="center" gap={1}>
                        {isUnacknowledged && (
                          <Circle 
                            sx={{ 
                              fontSize: 8, 
                              color: severityColor,
                              animation: 'pulse 2s infinite'
                            }} 
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, alert.id)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          background: `linear-gradient(135deg, ${severityColor}, ${alpha(severityColor, 0.7)})`,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {getAlertIcon(alert.alertType, alert.severity)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={600}
                            sx={{ 
                              textDecoration: alert.acknowledged ? 'line-through' : 'none' 
                            }}
                          >
                            {getAlertTypeText(alert.alertType)}
                          </Typography>
                          <Chip
                            label={getSeverityText(alert.severity)}
                            size="small"
                            sx={{
                              backgroundColor: alpha(severityColor, 0.1),
                              color: severityColor,
                              border: `1px solid ${alpha(severityColor, 0.3)}`,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                          {alert.acknowledged && (
                            <Chip
                              label="Acknowledged"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
    <Box>
                          <Typography variant="body2" color="textPrimary" gutterBottom>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {alert.sensorName} • {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
      </Typography>
    </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            {filteredAlerts.length > maxItems && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box textAlign="center">
                  <Button
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                  >
                    {expanded ? 'Show Less' : `Show ${filteredAlerts.length - maxItems} More`}
                  </Button>
                </Box>
              </>
            )}

            {unacknowledgedCount > 0 && !showAcknowledged && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box textAlign="center">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MarkEmailRead />}
                    onClick={() => {
                      // In real app: acknowledge all alerts
                      console.log('Acknowledging all alerts');
                    }}
                  >
                    Acknowledge All ({unacknowledgedCount})
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
        {selectedAlert && !alerts.find(a => a.id === selectedAlert)?.acknowledged && (
          <MenuItem onClick={() => selectedAlert && handleAcknowledge(selectedAlert)}>
            <MarkEmailRead fontSize="small" sx={{ mr: 1 }} />
            Acknowledge
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedAlert && handleDelete(selectedAlert)} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Alert
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default RecentAlerts; 