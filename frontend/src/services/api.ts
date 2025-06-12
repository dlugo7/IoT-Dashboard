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

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_ENDPOINT || 'https://api.yourdomain.com',
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
    const response = await this.api.get<ApiResponse<SensorConfig[]>>('/sensors');
    return response.data.data;
  }

  async getSensor(sensorId: string): Promise<SensorConfig> {
    const response = await this.api.get<ApiResponse<SensorConfig>>(`/sensors/${sensorId}`);
    return response.data.data;
  }

  async updateSensor(sensorId: string, config: Partial<SensorConfig>): Promise<SensorConfig> {
    const response = await this.api.put<ApiResponse<SensorConfig>>(`/sensors/${sensorId}`, config);
    return response.data.data;
  }

  async deleteSensor(sensorId: string): Promise<void> {
    await this.api.delete(`/sensors/${sensorId}`);
  }

  // Sensor data endpoints
  async getSensorData(sensorId: string, timeRange: TimeRange = '24h'): Promise<HistoricalData> {
    const response = await this.api.get<ApiResponse<HistoricalData>>(
      `/sensors/${sensorId}/data`,
      { params: { timeRange } }
    );
    return response.data.data;
  }

  async getLatestSensorData(): Promise<SensorData[]> {
    const response = await this.api.get<ApiResponse<SensorData[]>>('/sensors/data/latest');
    return response.data.data;
  }

  async submitSensorData(data: Omit<SensorData, 'timestamp'>): Promise<SensorData> {
    const response = await this.api.post<ApiResponse<SensorData>>('/sensors/data', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    return response.data.data;
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  }

  async getHistoricalData(timeRange: TimeRange = '24h'): Promise<HistoricalData[]> {
    const response = await this.api.get<ApiResponse<HistoricalData[]>>(
      '/dashboard/historical',
      { params: { timeRange } }
    );
    return response.data.data;
  }

  // Alerts endpoints
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    const response = await this.api.get<ApiResponse<Alert[]>>('/alerts', {
      params: { limit }
    });
    return response.data.data;
  }

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    const response = await this.api.put<ApiResponse<Alert>>(`/alerts/${alertId}/acknowledge`);
    return response.data.data;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.api.delete(`/alerts/${alertId}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get<ApiResponse<{ status: string; timestamp: string }>>('/health');
    return response.data.data;
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export individual methods for easier mocking in tests
export const {
  getSensors,
  getSensor,
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