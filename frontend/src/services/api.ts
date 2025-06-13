import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  SensorData, 
  SensorConfig, 
  DashboardStats, 
  HistoricalData, 
  Alert, 
  ApiResponse,
  TimeRange 
} from '../types/sensor';
import { 
  getMockSensors, 
  getMockSensor, 
  getMockDashboardStats, 
  getMockAlerts, 
  getMockHistoricalData 
} from './mockData';

// Get API endpoint from environment with robust checking
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT;
const IS_PRODUCTION = import.meta.env.PROD;

// Debug logging
console.log('🔍 API Service Debug Info:');
console.log('- VITE_API_ENDPOINT:', API_BASE_URL);
console.log('- IS_PRODUCTION:', IS_PRODUCTION);
console.log('- import.meta.env:', import.meta.env);

class ApiService {
  private api: AxiosInstance;
  private useMockData: boolean;

  constructor() {
    // Use mock data if no API endpoint is configured OR if it's the default placeholder OR if it's set to "mock"
    this.useMockData = !API_BASE_URL || 
                         API_BASE_URL === 'https://xsscwc1gya.execute-api.us-east-1.amazonaws.com/prod' ||
  API_BASE_URL.includes('execute-api.us-east-1.amazonaws.com') ||
                       API_BASE_URL === 'mock' ||
                       API_BASE_URL === 'demo' ||
                       API_BASE_URL === 'localhost';
    
    console.log('🎭 API Service Configuration:');
    console.log('- API_BASE_URL:', API_BASE_URL);
    console.log('- useMockData:', this.useMockData);
    
    if (this.useMockData) {
      console.info('🎭 Demo Mode: Using mock data (no valid API endpoint configured)');
    } else {
      console.info('🌐 Live Mode: Using real API endpoint:', API_BASE_URL);
    }

    this.api = axios.create({
      baseURL: API_BASE_URL || 'https://xsscwc1gya.execute-api.us-east-1.amazonaws.com/prod',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Sensor endpoints
  async getSensors(): Promise<SensorConfig[]> {
    if (this.useMockData) {
      console.log('📊 Using mock sensors data');
      return await getMockSensors();
    }
    
    try {
      const response = await this.api.get<ApiResponse<SensorConfig[]>>('/sensors');
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      return await getMockSensors();
    }
  }

  async getSensor(sensorId: string): Promise<SensorConfig> {
    if (this.useMockData) {
      console.log('📊 Using mock sensor data for:', sensorId);
      return await getMockSensor(sensorId);
    }
    
    try {
      const response = await this.api.get<ApiResponse<SensorConfig>>(`/sensors/${sensorId}`);
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      return await getMockSensor(sensorId);
    }
  }

  async createSensor(sensorData: Omit<SensorConfig, 'sensorId' | 'lastSeen'>): Promise<SensorConfig> {
    if (this.useMockData) {
      // For demo purposes, simulate creating a sensor
      const newSensor: SensorConfig = {
        ...sensorData,
        sensorId: `sensor-${Date.now()}`,
        lastSeen: new Date().toISOString(),
      };
      console.info('Demo: Simulated sensor creation:', newSensor);
      return newSensor;
    }
    
    const response = await this.api.post<ApiResponse<SensorConfig>>('/sensors', sensorData);
    return response.data.data;
  }

  async updateSensor(sensorId: string, config: Partial<SensorConfig>): Promise<SensorConfig> {
    if (this.useMockData) {
      // For demo purposes, simulate updating a sensor
      const existingSensor = await getMockSensor(sensorId);
      const updatedSensor = { ...existingSensor, ...config };
      console.info('Demo: Simulated sensor update:', updatedSensor);
      return updatedSensor;
    }
    
    const response = await this.api.put<ApiResponse<SensorConfig>>(`/sensors/${sensorId}`, config);
    return response.data.data;
  }

  async deleteSensor(sensorId: string): Promise<void> {
    if (this.useMockData) {
      console.info('Demo: Simulated sensor deletion:', sensorId);
      return;
    }
    
    await this.api.delete(`/sensors/${sensorId}`);
  }

  // Sensor data endpoints
  async getSensorData(sensorId: string, timeRange: TimeRange = '24h'): Promise<HistoricalData> {
    if (this.useMockData) {
      const historicalData = await getMockHistoricalData(timeRange);
      // Return the first data point for this sensor
      const sensorData = historicalData.find(data => 
        data.sensors.some(s => s.sensorId === sensorId)
      );
      return sensorData || historicalData[0];
    }
    
    const response = await this.api.get<ApiResponse<HistoricalData>>(
      `/sensors/${sensorId}/data`,
      { params: { timeRange } }
    );
    return response.data.data;
  }

  async getLatestSensorData(): Promise<SensorData[]> {
    if (this.useMockData) {
      // Generate latest sensor data from mock sensors
      const sensors = await getMockSensors();
      return sensors.map(sensor => ({
        sensorId: sensor.sensorId,
        timestamp: new Date().toISOString(),
        sensorType: sensor.sensorType,
        value: Math.random() * 100, // Random value for demo
        unit: sensor.sensorType === 'temperature' ? '°C' : 
              sensor.sensorType === 'humidity' ? '%' : 
              sensor.sensorType === 'power' ? 'W' : '',
        location: sensor.location,
        batteryLevel: sensor.batteryLevel || 100,
        status: sensor.isActive ? 'online' as const : 'offline' as const,
      }));
    }
    
    const response = await this.api.get<ApiResponse<SensorData[]>>('/sensors/data/latest');
    return response.data.data;
  }

  async submitSensorData(data: Omit<SensorData, 'timestamp'>): Promise<SensorData> {
    if (this.useMockData) {
      const sensorData: SensorData = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      console.info('Demo: Simulated sensor data submission:', sensorData);
      return sensorData;
    }
    
    const response = await this.api.post<ApiResponse<SensorData>>('/sensors/data', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    return response.data.data;
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    if (this.useMockData) {
      console.log('📊 Using mock dashboard stats');
      return await getMockDashboardStats();
    }
    
    try {
      const response = await this.api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      return await getMockDashboardStats();
    }
  }

  async getHistoricalData(timeRange: TimeRange = '24h'): Promise<HistoricalData[]> {
    if (this.useMockData) {
      console.log('📊 Using mock historical data for:', timeRange);
      return await getMockHistoricalData(timeRange);
    }
    
    try {
      const response = await this.api.get<ApiResponse<HistoricalData[]>>(
        '/dashboard/historical',
        { params: { timeRange } }
      );
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      return await getMockHistoricalData(timeRange);
    }
  }

  // Alerts endpoints
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    if (this.useMockData) {
      console.log('📊 Using mock alerts data');
      return await getMockAlerts();
    }
    
    try {
      const response = await this.api.get<ApiResponse<Alert[]>>('/alerts', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      return await getMockAlerts();
    }
  }

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    if (this.useMockData) {
      const alerts = await getMockAlerts();
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        const acknowledgedAlert = { ...alert, acknowledged: true };
        console.info('Demo: Simulated alert acknowledgment:', acknowledgedAlert);
        return acknowledgedAlert;
      }
      throw new Error(`Alert ${alertId} not found`);
    }
    
    const response = await this.api.put<ApiResponse<Alert>>(`/alerts/${alertId}/acknowledge`);
    return response.data.data;
  }

  async deleteAlert(alertId: string): Promise<void> {
    if (this.useMockData) {
      console.info('Demo: Simulated alert deletion:', alertId);
      return;
    }
    
    await this.api.delete(`/alerts/${alertId}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    if (this.useMockData) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    }
    
    const response = await this.api.get<ApiResponse<{ status: string; timestamp: string }>>('/health');
    return response.data.data;
  }

  // Utility method to check if using mock data
  public isUsingMockData(): boolean {
    return this.useMockData;
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export individual methods for easier mocking in tests
export const {
  getSensors,
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorData,
  getLatestSensorData,
  submitSensorData,
  getDashboardStats,
  getHistoricalData,
  getAlerts,
  acknowledgeAlert,
  deleteAlert,
  healthCheck
} = apiService; 