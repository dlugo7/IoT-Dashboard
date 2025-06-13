import { SensorConfig, SensorData, DashboardStats, Alert, HistoricalData, TimeRange } from '../types/sensor';

// Mock sensor configurations
export const mockSensors: SensorConfig[] = [
  {
    sensorId: 'temp-001',
    name: 'Living Room Temperature',
    sensorType: 'temperature',
    location: 'Living Room',
    isActive: true,
    batteryLevel: 87,
    lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    minValue: 18,
    maxValue: 28,
    alertThreshold: 25,
  },
  {
    sensorId: 'hum-001',
    name: 'Living Room Humidity',
    sensorType: 'humidity',
    location: 'Living Room',
    isActive: true,
    batteryLevel: 92,
    lastSeen: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
    minValue: 30,
    maxValue: 70,
    alertThreshold: 65,
  },
  {
    sensorId: 'temp-002',
    name: 'Bedroom Temperature',
    sensorType: 'temperature',
    location: 'Bedroom',
    isActive: true,
    batteryLevel: 76,
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    minValue: 16,
    maxValue: 26,
    alertThreshold: 24,
  },
  {
    sensorId: 'motion-001',
    name: 'Front Door Motion',
    sensorType: 'motion',
    location: 'Entrance',
    isActive: true,
    batteryLevel: 45,
    lastSeen: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
    alertThreshold: 1,
  },
  {
    sensorId: 'power-001',
    name: 'Kitchen Power Monitor',
    sensorType: 'power',
    location: 'Kitchen',
    isActive: true,
    batteryLevel: 100, // Wired sensor
    lastSeen: new Date(Date.now() - 10 * 1000).toISOString(), // 10 seconds ago
    minValue: 0,
    maxValue: 3000,
    alertThreshold: 2500,
  },
  {
    sensorId: 'temp-003',
    name: 'Garage Temperature',
    sensorType: 'temperature',
    location: 'Garage',
    isActive: false,
    batteryLevel: 12,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    minValue: -10,
    maxValue: 40,
    alertThreshold: 35,
  },
  {
    sensorId: 'hum-002',
    name: 'Bathroom Humidity',
    sensorType: 'humidity',
    location: 'Bathroom',
    isActive: true,
    batteryLevel: 68,
    lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
    minValue: 40,
    maxValue: 80,
    alertThreshold: 75,
  },
  {
    sensorId: 'motion-002',
    name: 'Backyard Motion',
    sensorType: 'motion',
    location: 'Backyard',
    isActive: true,
    batteryLevel: 89,
    lastSeen: new Date(Date.now() - 45 * 1000).toISOString(), // 45 seconds ago
    alertThreshold: 1,
  },
];

// Generate realistic sensor data
const generateSensorValue = (sensor: SensorConfig, baseTime: Date): number => {
  const now = baseTime.getTime();
  const hourOfDay = baseTime.getHours();
  
  switch (sensor.sensorType) {
    case 'temperature':
      // Temperature varies by location and time of day
      let baseTemp = 22;
      if (sensor.location === 'Bedroom') baseTemp = 20;
      if (sensor.location === 'Garage') baseTemp = 15;
      
      // Add daily variation
      const dailyVariation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 3;
      const randomVariation = (Math.random() - 0.5) * 2;
      
      return Math.round((baseTemp + dailyVariation + randomVariation) * 10) / 10;
      
    case 'humidity':
      // Humidity varies by location
      let baseHumidity = 45;
      if (sensor.location === 'Bathroom') baseHumidity = 65;
      
      const humidityVariation = Math.sin((hourOfDay - 3) * Math.PI / 8) * 10;
      const randomHumVariation = (Math.random() - 0.5) * 5;
      
      return Math.max(20, Math.min(80, Math.round(baseHumidity + humidityVariation + randomHumVariation)));
      
    case 'motion':
      // Motion is binary but we can simulate detection frequency
      return Math.random() < 0.1 ? 1 : 0;
      
    case 'power':
      // Power usage varies throughout the day
      let basePower = 150;
      if (hourOfDay >= 6 && hourOfDay <= 9) basePower = 800; // Morning
      if (hourOfDay >= 17 && hourOfDay <= 21) basePower = 1200; // Evening
      
      const powerVariation = (Math.random() - 0.5) * 200;
      return Math.max(50, Math.round(basePower + powerVariation));
      
    default:
      return Math.random() * 100;
  }
};

// Generate historical data
export const generateMockHistoricalData = (timeRange: TimeRange = '24h'): HistoricalData[] => {
  const now = new Date();
  const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
  const interval = timeRange === '24h' ? 60 : timeRange === '7d' ? 360 : 720; // minutes
  
  const data: HistoricalData[] = [];
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval * 60 * 1000);
    
    const dataPoint: HistoricalData = {
      timestamp: timestamp.toISOString(),
      sensors: mockSensors.filter(s => s.isActive).map(sensor => ({
        sensorId: sensor.sensorId,
        value: generateSensorValue(sensor, timestamp),
        unit: sensor.sensorType === 'temperature' ? '°C' : 
              sensor.sensorType === 'humidity' ? '%' : 
              sensor.sensorType === 'power' ? 'W' : '',
      })),
    };
    
    data.push(dataPoint);
  }
  
  return data;
};

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  totalSensors: mockSensors.length,
  activeSensors: mockSensors.filter(s => s.isActive).length,
  offlineSensors: mockSensors.filter(s => !s.isActive).length,
  averageTemperature: 22.3,
  averageHumidity: 48.7,
  energyConsumption: 2847,
  lastUpdated: new Date().toISOString(),
};

// Mock alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    sensorId: 'temp-003',
    type: 'warning',
    message: 'Garage Temperature sensor has low battery (12%)',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledged: false,
    priority: 'medium',
  },
  {
    id: 'alert-002',
    sensorId: 'temp-003',
    type: 'error',
    message: 'Garage Temperature sensor offline for 2 hours',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
    priority: 'high',
  },
  {
    id: 'alert-003',
    sensorId: 'hum-001',
    type: 'info',
    message: 'Living Room humidity levels optimal',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledged: true,
    priority: 'low',
  },
  {
    id: 'alert-004',
    sensorId: 'motion-001',
    type: 'warning',
    message: 'Front Door motion detected outside normal hours',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: false,
    priority: 'medium',
  },
  {
    id: 'alert-005',
    sensorId: 'power-001',
    type: 'info',
    message: 'Kitchen power usage within normal range',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    acknowledged: true,
    priority: 'low',
  },
];

// Mock API delay simulation
export const simulateApiDelay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Export individual mock functions for easy use
export const getMockSensors = async (): Promise<SensorConfig[]> => {
  await simulateApiDelay(600);
  return [...mockSensors];
};

export const getMockSensor = async (sensorId: string): Promise<SensorConfig> => {
  await simulateApiDelay(400);
  const sensor = mockSensors.find(s => s.sensorId === sensorId);
  if (!sensor) throw new Error(`Sensor ${sensorId} not found`);
  return { ...sensor };
};

export const getMockDashboardStats = async (): Promise<DashboardStats> => {
  await simulateApiDelay(500);
  return { ...mockDashboardStats };
};

export const getMockAlerts = async (): Promise<Alert[]> => {
  await simulateApiDelay(300);
  return [...mockAlerts];
};

export const getMockHistoricalData = async (timeRange: TimeRange = '24h'): Promise<HistoricalData[]> => {
  await simulateApiDelay(800);
  return generateMockHistoricalData(timeRange);
}; 