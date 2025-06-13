import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ButtonGroup,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  ShowChart,
  Assessment,
  DateRange,
  FilterList,
  Download,
  Refresh,
  ThermostatAuto,
  WaterDrop,
  ElectricBolt,
  Security,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import { format, subDays, subHours, parseISO } from 'date-fns';
import { useSensors, useHistoricalData } from '../hooks/useSensorData';
import { TimeRange } from '../types/sensor';

// Mock historical data generator
const generateMockHistoricalData = (days: number = 7) => {
  const data: any[] = [];
  const sensors = [
    { id: 'temp-001', name: 'Living Room', type: 'temperature', baseValue: 22, variance: 3 },
    { id: 'humid-001', name: 'Kitchen', type: 'humidity', baseValue: 45, variance: 8 },
    { id: 'power-001', name: 'Main Power', type: 'power', baseValue: 2500, variance: 500 },
    { id: 'motion-001', name: 'Front Door', type: 'motion', baseValue: 0.1, variance: 0.3 },
  ];

  for (let day = days; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour += 2) {
      const timestamp = subHours(subDays(new Date(), day), 24 - hour);
      
      sensors.forEach(sensor => {
        const variation = (Math.random() - 0.5) * sensor.variance;
        let value = sensor.baseValue + variation;
        
        // Add some realistic patterns
        if (sensor.type === 'temperature') {
          // Temperature peaks in afternoon
          const hourFactor = Math.sin((hour - 6) * Math.PI / 12) * 2;
          value += hourFactor;
        } else if (sensor.type === 'power') {
          // Power consumption higher during day
          const hourFactor = hour > 7 && hour < 22 ? 300 : -200;
          value += hourFactor;
        }
        
        data.push({
          timestamp: timestamp.toISOString(),
          sensorId: sensor.id,
          sensorName: sensor.name,
          sensorType: sensor.type,
          value: Math.max(0, Number(value.toFixed(1))),
          hour,
          day: format(timestamp, 'MMM dd'),
        });
      });
    }
  }
  return data;
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedSensor, setSelectedSensor] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

  // Hooks
  const { data: sensors = [], isLoading: sensorsLoading } = useSensors();
  const { data: historicalData, isLoading: dataLoading } = useHistoricalData(timeRange);

  // Mock data for demonstration
  const mockData = useMemo(() => generateMockHistoricalData(
    timeRange === '1h' ? 0 : 
    timeRange === '6h' ? 0 : 
    timeRange === '24h' ? 1 : 
    timeRange === '7d' ? 7 : 30
  ), [timeRange]);

  // Process data for charts
  const chartData = useMemo(() => {
    const filtered = selectedSensor === 'all' 
      ? mockData 
      : mockData.filter(d => d.sensorId === selectedSensor);

    // Group by timestamp for multi-sensor charts
    const grouped = filtered.reduce((acc, item) => {
      const key = item.timestamp;
      if (!acc[key]) {
        acc[key] = { timestamp: key, time: format(parseISO(key), 'HH:mm'), day: item.day };
      }
      acc[key][item.sensorType] = item.value;
      acc[key][`${item.sensorType}_name`] = item.sensorName;
      return acc;
    }, {} as any);

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [mockData, selectedSensor]);

  // Calculate statistics
  const stats = useMemo(() => {
    const sensorStats = mockData.reduce((acc, item) => {
      if (!acc[item.sensorType]) {
        acc[item.sensorType] = { values: [], name: item.sensorName };
      }
      acc[item.sensorType].values.push(item.value);
      return acc;
    }, {} as any);

    return Object.entries(sensorStats).map(([type, data]: [string, any]) => {
      const values = data.values;
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const latest = values[values.length - 1];
      const previous = values[values.length - 2] || latest;
      const trend = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';

      return {
        type,
        name: data.name,
        avg: Number(avg.toFixed(1)),
        min,
        max,
        latest,
        trend,
        change: Number(((latest - previous) / previous * 100).toFixed(1))
      };
    });
  }, [mockData]);

  // Chart colors
  const colors = {
    temperature: '#ff7300',
    humidity: '#00C7BE',
    power: '#8884d8',
    motion: '#82ca9d',
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <ThermostatAuto fontSize="small" />;
      case 'humidity': return <WaterDrop fontSize="small" />;
      case 'power': return <ElectricBolt fontSize="small" />;
      case 'motion': return <Security fontSize="small" />;
      default: return <ShowChart fontSize="small" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" fontSize="small" />;
      case 'down': return <TrendingDown color="error" fontSize="small" />;
      default: return <Timeline color="disabled" fontSize="small" />;
    }
  };

  if (sensorsLoading || dataLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
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
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Sensor</InputLabel>
            <Select
              value={selectedSensor}
              label="Sensor"
              onChange={(e) => setSelectedSensor(e.target.value)}
            >
              <MenuItem value="all">All Sensors</MenuItem>
              {sensors.map((sensor) => (
                <MenuItem key={sensor.sensorId} value={sensor.sensorId}>
                  {sensor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.type}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.name}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.latest}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      {getTrendIcon(stat.trend)}
                      <Typography 
                        variant="body2" 
                        color={stat.trend === 'up' ? 'success.main' : stat.trend === 'down' ? 'error.main' : 'text.secondary'}
                      >
                        {stat.change > 0 ? '+' : ''}{stat.change}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box color={colors[stat.type as keyof typeof colors]}>
                    {getSensorIcon(stat.type)}
                  </Box>
                </Box>
                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    Min: {stat.min} | Max: {stat.max} | Avg: {stat.avg}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart Type Selector */}
      <Box mb={3}>
        <ButtonGroup variant="outlined" size="small">
          <Button
            variant={chartType === 'line' ? 'contained' : 'outlined'}
            onClick={() => setChartType('line')}
            startIcon={<ShowChart />}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'area' ? 'contained' : 'outlined'}
            onClick={() => setChartType('area')}
            startIcon={<Timeline />}
          >
            Area
          </Button>
          <Button
            variant={chartType === 'bar' ? 'contained' : 'outlined'}
            onClick={() => setChartType('bar')}
            startIcon={<Assessment />}
          >
            Bar
          </Button>
        </ButtonGroup>
      </Box>

      {/* Main Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sensor Data Trends
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <RechartsTooltip 
                        labelStyle={{ color: '#000' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                      />
                      <Legend />
                      {Object.entries(colors).map(([type, color]) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stroke={color}
                          strokeWidth={2}
                          dot={{ fill: color, strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip />
                      <Legend />
                      {Object.entries(colors).map(([type, color]) => (
                        <Area
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stackId="1"
                          stroke={color}
                          fill={color}
                          fillOpacity={0.6}
                        />
                      ))}
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip />
                      <Legend />
                      {Object.entries(colors).map(([type, color]) => (
                        <Bar
                          key={type}
                          dataKey={type}
                          fill={color}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sensor Type Distribution
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="avg"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colors[entry.type as keyof typeof colors]} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              <Box mt={2}>
                {stats.map((stat) => (
                  <Box key={stat.type} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        {stat.name} Efficiency
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {Math.min(100, (stat.avg / stat.max * 100)).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (stat.avg / stat.max * 100))}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: colors[stat.type as keyof typeof colors],
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Analytics
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sensor</TableCell>
                      <TableCell align="right">Current</TableCell>
                      <TableCell align="right">Average</TableCell>
                      <TableCell align="right">Min</TableCell>
                      <TableCell align="right">Max</TableCell>
                      <TableCell align="right">Trend</TableCell>
                      <TableCell align="right">Change %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.map((stat) => (
                      <TableRow key={stat.type} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getSensorIcon(stat.type)}
                            {stat.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {stat.latest}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{stat.avg}</TableCell>
                        <TableCell align="right">{stat.min}</TableCell>
                        <TableCell align="right">{stat.max}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                            {getTrendIcon(stat.trend)}
                            <Chip
                              label={stat.trend}
                              size="small"
                              color={
                                stat.trend === 'up' ? 'success' : 
                                stat.trend === 'down' ? 'error' : 'default'
                              }
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={
                              stat.change > 0 ? 'success.main' : 
                              stat.change < 0 ? 'error.main' : 'text.secondary'
                            }
                          >
                            {stat.change > 0 ? '+' : ''}{stat.change}%
      </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Demo Alert */}
      <Box mt={3}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            📊 <strong>Demo Mode:</strong> This analytics dashboard shows simulated data with realistic patterns. 
            In production, this would display real sensor data from your IoT devices with live updates.
      </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default Analytics;