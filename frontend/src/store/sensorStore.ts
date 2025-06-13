import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SensorData, SensorConfig, DashboardStats, Alert } from '../types/sensor';

interface SensorStore {
  // State
  sensors: SensorConfig[];
  sensorData: Record<string, SensorData[]>;
  dashboardStats: DashboardStats | null;
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  setSensors: (sensors: SensorConfig[]) => void;
  addSensor: (sensor: SensorConfig) => void;
  updateSensor: (sensorId: string, updates: Partial<SensorConfig>) => void;
  removeSensor: (sensorId: string) => void;
  
  setSensorData: (sensorId: string, data: SensorData[]) => void;
  addSensorDataPoint: (sensorData: SensorData) => void;
  
  setDashboardStats: (stats: DashboardStats) => void;
  
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed values
  getActiveSensors: () => SensorConfig[];
  getSensorById: (sensorId: string) => SensorConfig | undefined;
  getLatestSensorData: (sensorId: string) => SensorData | undefined;
  getUnacknowledgedAlerts: () => Alert[];
}

export const useSensorStore = create<SensorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      sensors: [],
      sensorData: {},
      dashboardStats: null,
      alerts: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Actions
      setSensors: (sensors) =>
        set({ sensors, lastUpdated: new Date().toISOString() }, false, 'setSensors'),

      addSensor: (sensor) =>
        set(
          (state) => ({
            sensors: [...state.sensors, sensor],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'addSensor'
        ),

      updateSensor: (sensorId, updates) =>
        set(
          (state) => ({
            sensors: state.sensors.map((sensor) =>
              sensor.sensorId === sensorId ? { ...sensor, ...updates } : sensor
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'updateSensor'
        ),

      removeSensor: (sensorId) =>
        set(
          (state) => ({
            sensors: state.sensors.filter((sensor) => sensor.sensorId !== sensorId),
            sensorData: Object.fromEntries(
              Object.entries(state.sensorData).filter(([id]) => id !== sensorId)
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'removeSensor'
        ),

      setSensorData: (sensorId, data) =>
        set(
          (state) => ({
            sensorData: {
              ...state.sensorData,
              [sensorId]: data,
            },
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'setSensorData'
        ),

      addSensorDataPoint: (newData) =>
        set(
          (state) => {
            const existingData = state.sensorData[newData.sensorId] || [];
            const updatedData = [...existingData, newData]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .slice(-100); // Keep only last 100 data points

            return {
              sensorData: {
                ...state.sensorData,
                [newData.sensorId]: updatedData,
              },
              lastUpdated: new Date().toISOString(),
            };
          },
          false,
          'addSensorDataPoint'
        ),

      setDashboardStats: (stats) =>
        set({ dashboardStats: stats, lastUpdated: new Date().toISOString() }, false, 'setDashboardStats'),

      setAlerts: (alerts) =>
        set({ alerts, lastUpdated: new Date().toISOString() }, false, 'setAlerts'),

      addAlert: (alert) =>
        set(
          (state) => ({
            alerts: [alert, ...state.alerts].slice(0, 50), // Keep only last 50 alerts
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'addAlert'
        ),

      acknowledgeAlert: (alertId) =>
        set(
          (state) => ({
            alerts: state.alerts.map((alert) =>
              alert.id === alertId ? { ...alert, acknowledged: true } : alert
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'acknowledgeAlert'
        ),

      removeAlert: (alertId) =>
        set(
          (state) => ({
            alerts: state.alerts.filter((alert) => alert.id !== alertId),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          'removeAlert'
        ),

      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      clearError: () => set({ error: null }, false, 'clearError'),

      // Computed values
      getActiveSensors: () => get().sensors.filter((sensor) => sensor.isActive),

      getSensorById: (sensorId) =>
        get().sensors.find((sensor) => sensor.sensorId === sensorId),

      getLatestSensorData: (sensorId) => {
        const data = get().sensorData[sensorId];
        return data && data.length > 0 ? data[data.length - 1] : undefined;
      },

      getUnacknowledgedAlerts: () =>
        get().alerts.filter((alert) => !alert.acknowledged),
    }),
    {
      name: 'sensor-store',
    }
  )
); 