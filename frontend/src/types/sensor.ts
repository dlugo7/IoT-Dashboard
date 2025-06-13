export interface SensorData {
  sensorId: string;
  timestamp: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  location: string;
  batteryLevel: number;
  status: SensorStatus;
}

export interface SensorConfig {
  sensorId: string;
  name: string;
  sensorType: SensorType;
  location: string;
  minValue?: number;
  maxValue?: number;
  alertThreshold?: number;
  isActive: boolean;
  lastSeen: string;
  batteryLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSensorRequest {
  name: string;
  sensorType: SensorType;
  location: string;
  minValue?: number;
  maxValue?: number;
  alertThreshold?: number;
  isActive: boolean;
}

export interface DashboardStats {
  totalSensors: number;
  activeSensors: number;
  offlineSensors: number;
  averageTemperature: number;
  averageHumidity: number;
  motionDetections?: number;
  energyConsumption: number;
  lastUpdated: string;
}

export interface HistoricalData {
  timestamp: string;
  sensors: Array<{
  sensorId: string;
    value: number;
    unit: string;
  }>;
}

export interface SensorReading {
  timestamp: string;
  value: number;
}

export interface Alert {
  id: string;
  sensorId: string;
  sensorName?: string;
  type: 'info' | 'warning' | 'error';
  alertType?: AlertType;
  message: string;
  severity?: AlertSeverity;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  acknowledged: boolean;
}

export type SensorType = 
  | 'temperature' 
  | 'humidity' 
  | 'motion' 
  | 'door' 
  | 'window' 
  | 'power' 
  | 'light' 
  | 'air_quality';

export type SensorStatus = 'online' | 'offline' | 'warning' | 'error';

export type AlertType = 
  | 'threshold_exceeded' 
  | 'sensor_offline' 
  | 'battery_low' 
  | 'motion_detected' 
  | 'door_opened';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface Location {
  id: string;
  name: string;
  sensors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'sensor_data' | 'alert' | 'status_update';
  payload: SensorData | Alert | any;
  timestamp: string;
}

// Chart data interfaces
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'area';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
} 