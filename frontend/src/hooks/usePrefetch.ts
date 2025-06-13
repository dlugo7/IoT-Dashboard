import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from './useSensorData';
import apiService from '../services/api';

export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchSensors = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.sensors,
      queryFn: () => apiService.getSensors(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient]);

  const prefetchDashboardStats = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardStats,
      queryFn: () => apiService.getDashboardStats(),
      staleTime: 15000, // 15 seconds
    });
  }, [queryClient]);

  const prefetchAlerts = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.alerts,
      queryFn: () => apiService.getAlerts(),
      staleTime: 30000, // 30 seconds
    });
  }, [queryClient]);

  const prefetchHistoricalData = useCallback((timeRange: '24h' | '7d' | '30d' = '24h') => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.historicalData(timeRange),
      queryFn: () => apiService.getHistoricalData(timeRange),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);

  const prefetchDashboard = useCallback(() => {
    // Prefetch all dashboard-related data
    prefetchSensors();
    prefetchDashboardStats();
    prefetchAlerts();
  }, [prefetchSensors, prefetchDashboardStats, prefetchAlerts]);

  const prefetchAnalytics = useCallback(() => {
    // Prefetch analytics data
    prefetchSensors();
    prefetchHistoricalData('24h');
    prefetchHistoricalData('7d');
  }, [prefetchSensors, prefetchHistoricalData]);

  const prefetchSensorsPage = useCallback(() => {
    // Prefetch sensors page data
    prefetchSensors();
  }, [prefetchSensors]);

  return {
    prefetchSensors,
    prefetchDashboardStats,
    prefetchAlerts,
    prefetchHistoricalData,
    prefetchDashboard,
    prefetchAnalytics,
    prefetchSensorsPage,
  };
}; 