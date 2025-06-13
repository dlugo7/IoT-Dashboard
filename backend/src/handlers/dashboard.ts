import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import DynamoDBService from '../services/dynamodb';
import { 
  DashboardStats,
  ApiResponse,
  ApiError,
  TimeRange 
} from '../types/sensor';

const dynamoService = new DynamoDBService();

// Helper function to create API response
const createResponse = (statusCode: number, body: ApiResponse<any> | ApiError): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

const createSuccessResponse = <T>(data: T, message?: string): APIGatewayProxyResult => 
  createResponse(200, {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });

const createErrorResponse = (statusCode: number, code: string, message: string, details?: any): APIGatewayProxyResult =>
  createResponse(statusCode, {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  });

// GET /dashboard/stats - Get dashboard statistics
export const getStats = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Getting dashboard statistics');
    
    // Get all sensors
    const sensors = await dynamoService.getAllSensors();
    const activeSensors = sensors.filter(sensor => sensor.isActive);
    
    // Get latest data for all sensors
    const latestDataPromises = activeSensors.map(async (sensor) => {
      return await dynamoService.getLatestSensorData(sensor.sensorId);
    });
    
    const latestDataResults = await Promise.all(latestDataPromises);
    const validLatestData = latestDataResults.filter(data => data !== null);
    
    // Calculate statistics
    const temperatureData = validLatestData.filter(data => data?.sensorType === 'temperature');
    const humidityData = validLatestData.filter(data => data?.sensorType === 'humidity');
    const motionData = validLatestData.filter(data => data?.sensorType === 'motion');
    const powerData = validLatestData.filter(data => data?.sensorType === 'power');
    
    const averageTemperature = temperatureData.length > 0 
      ? temperatureData.reduce((sum, data) => sum + (data?.value || 0), 0) / temperatureData.length
      : 0;
      
    const averageHumidity = humidityData.length > 0
      ? humidityData.reduce((sum, data) => sum + (data?.value || 0), 0) / humidityData.length
      : 0;
      
    const motionDetections = motionData.reduce((sum, data) => sum + (data?.value || 0), 0);
    
    const energyConsumption = powerData.reduce((sum, data) => sum + (data?.value || 0), 0);
    
    const stats: DashboardStats = {
      totalSensors: sensors.length,
      activeSensors: activeSensors.length,
      averageTemperature: Math.round(averageTemperature * 10) / 10,
      averageHumidity: Math.round(averageHumidity * 10) / 10,
      motionDetections,
      energyConsumption,
      lastUpdated: new Date().toISOString(),
    };
    
    return createSuccessResponse(stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve dashboard statistics', error);
  }
};

// GET /dashboard/historical - Get historical data for dashboard
export const getHistoricalData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const timeRange = (event.queryStringParameters?.timeRange as TimeRange) || '24h';
    
    console.log(`Getting historical data for time range: ${timeRange}`);
    
    // Get all active sensors
    const sensors = await dynamoService.getAllSensors();
    const activeSensors = sensors.filter(sensor => sensor.isActive);
    
    // Get historical data for each sensor
    const historicalDataPromises = activeSensors.map(async (sensor) => {
      const data = await dynamoService.getSensorData(sensor.sensorId, timeRange);
      return {
        sensorId: sensor.sensorId,
        sensorName: sensor.name,
        sensorType: sensor.sensorType,
        location: sensor.location,
        data,
        timeRange,
      };
    });
    
    const historicalData = await Promise.all(historicalDataPromises);
    
    return createSuccessResponse(historicalData, `Historical data retrieved for ${historicalData.length} sensors`);
  } catch (error) {
    console.error('Error getting historical data:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve historical data', error);
  }
};

// GET /health - Health check endpoint
export const healthCheck = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'iot-dashboard-api',
    };
    
    return createSuccessResponse(health, 'Service is healthy');
  } catch (error) {
    console.error('Health check error:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Health check failed', error);
  }
};

// OPTIONS handler for CORS
export const optionsHandler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: '',
  };
}; 