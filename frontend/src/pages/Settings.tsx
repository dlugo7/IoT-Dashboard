import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  Storage,
  Palette,
  Language,
  Update,
  Backup,
  Download,
  Upload,
  Delete,
  Edit,
  Add,
  VolumeUp,
  Email,
  Sms,
  Notifications as Push,
  DarkMode,
  LightMode,
  AutoMode,
  Refresh,
  Save,
  RestoreFromTrash,
} from '@mui/icons-material';
import { useThemeStore, ThemeMode } from '../store/themeStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const { mode: themeMode, setThemeMode } = useThemeStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Settings state
  const [settings, setSettings] = useState({
    // General
    theme: themeMode, // light, dark, auto
    language: 'en',
    timezone: 'UTC',
    refreshInterval: 30,
    
    // Notifications
    enableNotifications: true,
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    soundEnabled: true,
    alertVolume: 70,
    
    // Alert Thresholds
    batteryLowThreshold: 20,
    temperatureThreshold: 25,
    humidityThreshold: 60,
    
    // Data & Storage
    dataRetention: 90, // days
    autoBackup: true,
    backupFrequency: 'weekly',
    exportFormat: 'json',
    
    // Security
    sessionTimeout: 30, // minutes
    twoFactorAuth: false,
    apiAccessLogging: true,
  });

  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Handle theme changes immediately
    if (key === 'theme') {
      setThemeMode(value as ThemeMode);
    }
  };

  const handleSave = () => {
    // In real app, this would save to backend
    setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
  };

  const handleExportData = () => {
    // Mock export functionality
    const dataBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Settings exported successfully!', severity: 'success' });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...settings, ...importedSettings });
          setSnackbar({ open: true, message: 'Settings imported successfully!', severity: 'success' });
        } catch (error) {
          setSnackbar({ open: true, message: 'Failed to import settings. Invalid file format.', severity: 'error' });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetSettings = () => {
    // Reset to defaults
    setSettings({
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      refreshInterval: 30,
      enableNotifications: true,
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      soundEnabled: true,
      alertVolume: 70,
      batteryLowThreshold: 20,
      temperatureThreshold: 25,
      humidityThreshold: 60,
      dataRetention: 90,
      autoBackup: true,
      backupFrequency: 'weekly',
      exportFormat: 'json',
      sessionTimeout: 30,
      twoFactorAuth: false,
      apiAccessLogging: true,
    });
    setDialogOpen(null);
    setSnackbar({ open: true, message: 'Settings reset to defaults!', severity: 'success' });
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <LightMode />;
      case 'dark': return <DarkMode />;
      default: return <AutoMode />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          System Settings
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RestoreFromTrash />}
            onClick={() => setDialogOpen('reset')}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<SettingsIcon />} label="General" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Storage />} label="Data & Storage" />
            <Tab icon={<Security />} label="Security" />
          </Tabs>
        </Box>

        {/* General Settings */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.theme}
                  label="Theme"
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  startAdornment={getThemeIcon(settings.theme)}
                >
                  <MenuItem value="light">
                    <Box display="flex" alignItems="center" gap={2}>
                      <LightMode fontSize="small" />
                      Light Mode
                    </Box>
                  </MenuItem>
                  <MenuItem value="dark">
                    <Box display="flex" alignItems="center" gap={2}>
                      <DarkMode fontSize="small" />
                      Dark Mode
                    </Box>
                  </MenuItem>
                  <MenuItem value="auto">
                    <Box display="flex" alignItems="center" gap={2}>
                      <AutoMode fontSize="small" />
                      Auto (System)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  label="Language"
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Timezone"
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Chicago">Central Time</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Performance
              </Typography>

              <Box mt={2}>
                <Typography gutterBottom>
                  Data Refresh Interval: {settings.refreshInterval} seconds
                </Typography>
                <Slider
                  value={settings.refreshInterval}
                  onChange={(_, value) => handleSettingChange('refreshInterval', value)}
                  min={5}
                  max={300}
                  marks={[
                    { value: 5, label: '5s' },
                    { value: 30, label: '30s' },
                    { value: 60, label: '1m' },
                    { value: 300, label: '5m' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                Lower refresh intervals provide more real-time data but may increase battery usage on mobile devices.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Settings */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Notification Channels
              </Typography>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Enable Notifications"
                    secondary="Master switch for all notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email fontSize="small" />
                        Email Alerts
                      </Box>
                    }
                    secondary="Receive alerts via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.emailAlerts}
                      onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                      disabled={!settings.enableNotifications}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Sms fontSize="small" />
                        SMS Alerts
                      </Box>
                    }
                    secondary="Receive critical alerts via SMS"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.smsAlerts}
                      onChange={(e) => handleSettingChange('smsAlerts', e.target.checked)}
                      disabled={!settings.enableNotifications}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Push fontSize="small" />
                        Push Notifications
                      </Box>
                    }
                    secondary="Browser push notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      disabled={!settings.enableNotifications}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.soundEnabled}
                      onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                      disabled={!settings.enableNotifications}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <VolumeUp fontSize="small" />
                      Sound Notifications
                    </Box>
                  }
                />

                {settings.soundEnabled && (
                  <Box mt={2}>
                    <Typography gutterBottom>
                      Alert Volume: {settings.alertVolume}%
                    </Typography>
                    <Slider
                      value={settings.alertVolume}
                      onChange={(_, value) => handleSettingChange('alertVolume', value)}
                      disabled={!settings.enableNotifications || !settings.soundEnabled}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Alert Thresholds
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                label="Battery Low Threshold (%)"
                type="number"
                value={settings.batteryLowThreshold}
                onChange={(e) => handleSettingChange('batteryLowThreshold', Number(e.target.value))}
                inputProps={{ min: 5, max: 50 }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Temperature Alert Threshold (°C)"
                type="number"
                value={settings.temperatureThreshold}
                onChange={(e) => handleSettingChange('temperatureThreshold', Number(e.target.value))}
                inputProps={{ min: -10, max: 50 }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Humidity Alert Threshold (%)"
                type="number"
                value={settings.humidityThreshold}
                onChange={(e) => handleSettingChange('humidityThreshold', Number(e.target.value))}
                inputProps={{ min: 20, max: 90 }}
              />

              <Alert severity="warning" sx={{ mt: 2 }}>
                These thresholds will trigger alerts when sensor values exceed the specified limits.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Data & Storage Settings */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Data Management
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                label="Data Retention Period (days)"
                type="number"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', Number(e.target.value))}
                inputProps={{ min: 7, max: 365 }}
                helperText="How long to keep historical sensor data"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoBackup}
                    onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                  />
                }
                label="Enable Automatic Backups"
                sx={{ display: 'block', mt: 2 }}
              />

              {settings.autoBackup && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Backup Frequency</InputLabel>
                  <Select
                    value={settings.backupFrequency}
                    label="Backup Frequency"
                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={settings.exportFormat}
                  label="Export Format"
                  onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                >
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="xlsx">Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Import/Export
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportData}
                  fullWidth
                >
                  Export Settings
                </Button>

                <input
                  accept=".json"
                  style={{ display: 'none' }}
                  id="import-settings-file"
                  type="file"
                  onChange={handleImportData}
                />
                <label htmlFor="import-settings-file">
                  <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    component="span"
                    fullWidth
                  >
                    Import Settings
                  </Button>
                </label>

                <Button
                  variant="outlined"
                  startIcon={<Backup />}
                  fullWidth
                >
                  Create Manual Backup
                </Button>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Storage Usage:</strong><br />
                  • Configuration: ~2 KB<br />
                  • Sensor Data: ~45 MB<br />
                  • Logs: ~12 MB<br />
                  <strong>Total: ~57 MB</strong>
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Authentication
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
                inputProps={{ min: 5, max: 480 }}
                helperText="Automatically log out after inactivity"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                  />
                }
                label="Enable Two-Factor Authentication"
                sx={{ display: 'block', mt: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.apiAccessLogging}
                    onChange={(e) => handleSettingChange('apiAccessLogging', e.target.checked)}
                  />
                }
                label="Enable API Access Logging"
                sx={{ display: 'block', mt: 1 }}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                Two-factor authentication adds an extra layer of security to your account.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Security Status
              </Typography>

              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge color={settings.twoFactorAuth ? 'success' : 'warning'} variant="dot">
                    <Avatar>
                      <Security />
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="subtitle1">
                      Security Score: {settings.twoFactorAuth ? '9' : '6'}/10
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {settings.twoFactorAuth ? 'Excellent security' : 'Good security'}
      </Typography>
                  </Box>
                </Box>
              </Card>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Password Strength"
                    secondary="Strong password detected"
                  />
                  <Chip label="✓" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary={settings.twoFactorAuth ? "Enabled" : "Disabled"}
                  />
                  <Chip 
                    label={settings.twoFactorAuth ? "✓" : "!"}
                    color={settings.twoFactorAuth ? "success" : "warning"} 
                    size="small" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="API Access Logging"
                    secondary={settings.apiAccessLogging ? "Enabled" : "Disabled"}
                  />
                  <Chip 
                    label={settings.apiAccessLogging ? "✓" : "!"}
                    color={settings.apiAccessLogging ? "success" : "warning"} 
                    size="small" 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={dialogOpen === 'reset'}
        onClose={() => setDialogOpen(null)}
      >
        <DialogTitle>Reset Settings to Defaults?</DialogTitle>
        <DialogContent>
          <Typography>
            This will reset all settings to their default values. This action cannot be undone.
      </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Cancel</Button>
          <Button onClick={handleResetSettings} color="error" variant="contained">
            Reset Settings
          </Button>
        </DialogActions>
      </Dialog>

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

export default Settings; 