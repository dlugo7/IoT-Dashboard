import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import apiService from '../services/api';
import { useSensorStore } from '../store/sensorStore';
import { SensorConfig, SensorData, CreateSensorRequest, TimeRange } from '../types/sensor';

// Query keys for React Query
export const queryKeys = {
  sensors: ['sensors'] as const,
  sensor: (id: string) => ['sensors', id] as const,
  sensorData: (id: string, timeRange: TimeRange) => ['sensorData', id, timeRange] as const,
  dashboardStats: ['dashboardStats'] as const,
  alerts: ['alerts'] as const,
  historicalData: (timeRange: TimeRange) => ['historicalData', timeRange] as const,
};

// Hook for fetching all sensors
export const useSensors = () => {
  const setSensors = useSensorStore((state) => state.setSensors);
  const setLoading = useSensorStore((state) => state.setLoading);
  const setError = useSensorStore((state) => state.setError);

  return useQuery({
    queryKey: queryKeys.sensors,
    queryFn: async () => {
      setLoading(true);
      try {
        const sensors = await apiService.getSensors();
        setSensors(sensors);
        setError(null);
        return sensors;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch sensors');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced for fresher data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    // Enable background updates
    refetchInterval: 60000, // Refetch every minute for sensor status updates
  });
};

// Hook for fetching single sensor
export const useSensor = (sensorId: string) => {
  return useQuery({
    queryKey: queryKeys.sensor(sensorId),
    queryFn: () => apiService.getSensor(sensorId),
    enabled: !!sensorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for sensor CRUD operations
export const useSensorMutations = () => {
  const queryClient = useQueryClient();
  const { addSensor, updateSensor: updateSensorStore, removeSensor } = useSensorStore();

  const createSensor = useMutation({
    mutationFn: (sensorData: CreateSensorRequest) => 
      apiService.createSensor(sensorData),
    onSuccess: (newSensor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
      addSensor(newSensor);
    },
  });

  const updateSensor = useMutation({
    mutationFn: ({ sensorId, updates }: { sensorId: string; updates: Partial<SensorConfig> }) => 
      apiService.updateSensor(sensorId, updates),
    onSuccess: (updatedSensor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
      queryClient.invalidateQueries({ queryKey: queryKeys.sensor(updatedSensor.sensorId) });
      updateSensorStore(updatedSensor.sensorId, updatedSensor);
    },
  });

  const deleteSensor = useMutation({
    mutationFn: (sensorId: string) => apiService.deleteSensor(sensorId),
    onSuccess: (_, sensorId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
      removeSensor(sensorId);
    },
  });

  return {
    createSensor,
    updateSensor,
    deleteSensor,
  };
};

// Hook for dashboard stats
export const useDashboardStats = () => {
  const setDashboardStats = useSensorStore((state) => state.setDashboardStats);
  
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const stats = await apiService.getDashboardStats();
      setDashboardStats(stats);
      return stats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // 15 seconds
    // Prefetch on idle for better performance
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Hook for alerts
export const useAlerts = () => {
  const setAlerts = useSensorStore((state) => state.setAlerts);
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts,
    queryFn: async () => {
      const alerts = await apiService.getAlerts();
      setAlerts(alerts);
      return alerts;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const acknowledgeAlert = useMutation({
    mutationFn: (alertId: string) => apiService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (alertId: string) => apiService.deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });

  return {
    ...alertsQuery,
    acknowledgeAlert,
    deleteAlert,
  };
};

// Hook for historical data
export const useHistoricalData = (timeRange: TimeRange = '24h') => {
  return useQuery({
    queryKey: queryKeys.historicalData(timeRange),
    queryFn: () => apiService.getHistoricalData(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for real-time data (will integrate with WebSocket)
export const useRealTimeData = () => {
  const addSensorDataPoint = useSensorStore((state) => state.addSensorDataPoint);
  const addAlert = useSensorStore((state) => state.addAlert);

  const handleSensorData = useCallback((data: SensorData) => {
    addSensorDataPoint(data);
  }, [addSensorDataPoint]);

  const handleAlert = useCallback((alert: any) => {
    addAlert(alert);
  }, [addAlert]);

  return {
    handleSensorData,
    handleAlert,
  };
}; 