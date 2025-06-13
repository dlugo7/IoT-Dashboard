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
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalSensors: number;
  activeSensors: number;
  averageTemperature: number;
  averageHumidity: number;
  motionDetections: number;
  energyConsumption: number;
  lastUpdated: string;
}

export interface Alert {
  id: string;
  sensorId: string;
  sensorName: string;
  alertType: AlertType;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
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

// DynamoDB table structures
export interface SensorDataRecord extends SensorData {
  pk: string; // Partition key: SENSOR#{sensorId}
  sk: string; // Sort key: DATA#{timestamp}
  ttl?: number; // TTL for automatic cleanup
}

export interface SensorConfigRecord extends SensorConfig {
  pk: string; // Partition key: SENSOR#{sensorId}
  sk: string; // Sort key: CONFIG
}

export interface AlertRecord extends Alert {
  pk: string; // Partition key: ALERT#{alertId}
  sk: string; // Sort key: ALERT#{timestamp}
  gsi1pk?: string; // GSI1 partition key: SENSOR#{sensorId}
  gsi1sk?: string; // GSI1 sort key: ALERT#{timestamp}
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

// Lambda event types
export interface SensorDataEvent {
  sensorId: string;
  data: Omit<SensorData, 'sensorId'>;
}

export interface WebSocketMessage {
  action: string;
  data: any;
  connectionId?: string;
}

// Validation schemas
export interface CreateSensorRequest {
  name: string;
  sensorType: SensorType;
  location: string;
  minValue?: number;
  maxValue?: number;
  alertThreshold?: number;
}

export interface UpdateSensorRequest {
  name?: string;
  location?: string;
  minValue?: number;
  maxValue?: number;
  alertThreshold?: number;
  isActive?: boolean;
}

export interface SubmitSensorDataRequest {
  sensorId: string;
  value: number;
  unit: string;
  batteryLevel: number;
  status?: SensorStatus;
} 