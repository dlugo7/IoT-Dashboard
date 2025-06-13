import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Fab,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ThermostatAuto,
  WaterDrop,
  Security,
  ElectricBolt,
  Lightbulb,
  Air,
  Sensors as SensorIcon,
  WifiTethering,
  WifiOff,
  Warning,
  Error,
  CheckCircle,
  Battery1Bar,
  Battery3Bar,
  BatteryFull,
} from '@mui/icons-material';
import { useSensors, useSensorMutations } from '../hooks/useSensorData';
import { SensorConfig, CreateSensorRequest, SensorType } from '../types/sensor';
import { formatDistanceToNow } from 'date-fns';

const Sensors: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSensor, setEditingSensor] = useState<SensorConfig | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Hooks
  const { data: sensors = [], isLoading, refetch } = useSensors();
  const { createSensor, updateSensor, deleteSensor } = useSensorMutations();

  // Form state
  const [formData, setFormData] = useState<CreateSensorRequest>({
    name: '',
    sensorType: 'temperature',
    location: '',
    minValue: undefined,
    maxValue: undefined,
    alertThreshold: undefined,
    isActive: true,
  });

  const handleOpenDialog = (sensor?: SensorConfig) => {
    if (sensor) {
      setEditingSensor(sensor);
      setFormData({
        name: sensor.name,
        sensorType: sensor.sensorType,
        location: sensor.location,
        minValue: sensor.minValue,
        maxValue: sensor.maxValue,
        alertThreshold: sensor.alertThreshold,
        isActive: sensor.isActive,
      });
    } else {
      setEditingSensor(null);
      setFormData({
        name: '',
        sensorType: 'temperature',
        location: '',
        minValue: undefined,
        maxValue: undefined,
        alertThreshold: undefined,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSensor(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingSensor) {
        await updateSensor.mutateAsync({ 
          sensorId: editingSensor.sensorId, 
          updates: formData 
        });
        setSnackbar({ open: true, message: 'Sensor updated successfully!', severity: 'success' });
      } else {
        await createSensor.mutateAsync(formData);
        setSnackbar({ open: true, message: 'Sensor created successfully!', severity: 'success' });
      }
      handleCloseDialog();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Failed to ${editingSensor ? 'update' : 'create'} sensor`, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (sensorId: string) => {
    if (window.confirm('Are you sure you want to delete this sensor?')) {
      try {
        await deleteSensor.mutateAsync(sensorId);
        setSnackbar({ open: true, message: 'Sensor deleted successfully!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete sensor', severity: 'error' });
      }
    }
  };

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

  const getStatusIcon = (isActive: boolean, lastSeen: string) => {
    const timeSinceLastSeen = Date.now() - new Date(lastSeen).getTime();
    const minutesAgo = timeSinceLastSeen / (1000 * 60);

    if (!isActive) return <WifiOff color="error" fontSize="small" />;
    if (minutesAgo > 30) return <Warning color="warning" fontSize="small" />;
    if (minutesAgo > 5) return <Warning color="warning" fontSize="small" />;
    return <CheckCircle color="success" fontSize="small" />;
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return null;
    if (level > 60) return <BatteryFull color="success" fontSize="small" />;
    if (level > 20) return <Battery3Bar color="warning" fontSize="small" />;
    return <Battery1Bar color="error" fontSize="small" />;
  };

  const getStatusColor = (isActive: boolean, lastSeen: string) => {
    const timeSinceLastSeen = Date.now() - new Date(lastSeen).getTime();
    const minutesAgo = timeSinceLastSeen / (1000 * 60);

    if (!isActive) return 'error';
    if (minutesAgo > 30) return 'warning';
    if (minutesAgo > 5) return 'warning';
    return 'success';
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Sensor Management
        </Typography>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Sensor Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Sensor
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sensors
              </Typography>
              <Typography variant="h4">
                {sensors.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Sensors
              </Typography>
              <Typography variant="h4" color="success.main">
                {sensors.filter(s => s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Offline Sensors
              </Typography>
              <Typography variant="h4" color="error.main">
                {sensors.filter(s => !s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Locations
              </Typography>
              <Typography variant="h4">
                {new Set(sensors.map(s => s.location)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sensors Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Sensors
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sensor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Seen</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sensors.map((sensor) => (
                  <TableRow key={sensor.sensorId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        {getSensorIcon(sensor.sensorType)}
                        <Box>
                          <Typography variant="subtitle2">
                            {sensor.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {sensor.sensorId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sensor.sensorType} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{sensor.location}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(sensor.isActive, sensor.lastSeen)}
                        <Chip
                          label={sensor.isActive ? 'Online' : 'Offline'}
                          color={getStatusColor(sensor.isActive, sensor.lastSeen)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDistanceToNow(new Date(sensor.lastSeen), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {sensor.alertThreshold ? (
                        <Typography variant="body2">
                          {sensor.alertThreshold}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit sensor">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(sensor)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete sensor">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(sensor.sensorId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {sensors.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No sensors found
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Get started by adding your first sensor
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add First Sensor
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sensor Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sensor Type</InputLabel>
                  <Select
                    value={formData.sensorType}
                    label="Sensor Type"
                    onChange={(e) => setFormData({ ...formData, sensorType: e.target.value as SensorType })}
                  >
                    <MenuItem value="temperature">Temperature</MenuItem>
                    <MenuItem value="humidity">Humidity</MenuItem>
                    <MenuItem value="motion">Motion</MenuItem>
                    <MenuItem value="door">Door</MenuItem>
                    <MenuItem value="window">Window</MenuItem>
                    <MenuItem value="power">Power</MenuItem>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="air_quality">Air Quality</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Value"
                  type="number"
                  value={formData.minValue || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    minValue: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Value"
                  type="number"
                  value={formData.maxValue || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxValue: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Alert Threshold"
                  type="number"
                  value={formData.alertThreshold || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    alertThreshold: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.location}
          >
            {editingSensor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add sensor"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sensors; 