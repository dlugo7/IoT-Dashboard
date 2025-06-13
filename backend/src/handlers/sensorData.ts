import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import DynamoDBService from '../services/dynamodb';
import { 
  SensorData, 
  SubmitSensorDataRequest,
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

// GET /sensors/{sensorId}/data - Get sensor data
export const getSensorData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sensorId = event.pathParameters?.sensorId;
    const timeRange = (event.queryStringParameters?.timeRange as TimeRange) || '24h';
    
    if (!sensorId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Sensor ID is required');
    }

    console.log(`Getting sensor data for: ${sensorId}, timeRange: ${timeRange}`);
    
    const sensorData = await dynamoService.getSensorData(sensorId, timeRange);
    
    return createSuccessResponse({
      sensorId,
      data: sensorData,
      timeRange,
    }, `Retrieved ${sensorData.length} data points`);
  } catch (error) {
    console.error('Error getting sensor data:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve sensor data', error);
  }
};

// GET /sensors/data/latest - Get latest data for all sensors
export const getLatestSensorData = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Getting latest sensor data for all sensors');
    
    // First get all sensors
    const sensors = await dynamoService.getAllSensors();
    
    // Then get latest data for each sensor
    const latestDataPromises = sensors.map(async (sensor) => {
      const latestData = await dynamoService.getLatestSensorData(sensor.sensorId);
      return latestData;
    });
    
    const latestDataResults = await Promise.all(latestDataPromises);
    const validData = latestDataResults.filter(data => data !== null);
    
    return createSuccessResponse(validData, `Retrieved latest data for ${validData.length} sensors`);
  } catch (error) {
    console.error('Error getting latest sensor data:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve latest sensor data', error);
  }
};

// POST /sensors/data - Submit new sensor data
export const submitSensorData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'MISSING_BODY', 'Request body is required');
    }

    const requestData: SubmitSensorDataRequest = JSON.parse(event.body);
    
    // Validate required fields
    if (!requestData.sensorId || requestData.value === undefined || !requestData.unit) {
      return createErrorResponse(400, 'MISSING_FIELDS', 'sensorId, value, and unit are required');
    }

    // Get sensor configuration to validate and get additional info
    const sensorConfig = await dynamoService.getSensor(requestData.sensorId);
    if (!sensorConfig) {
      return createErrorResponse(404, 'SENSOR_NOT_FOUND', `Sensor ${requestData.sensorId} not found`);
    }

    const now = new Date().toISOString();
    
    const sensorData: SensorData = {
      sensorId: requestData.sensorId,
      timestamp: now,
      sensorType: sensorConfig.sensorType,
      value: requestData.value,
      unit: requestData.unit,
      location: sensorConfig.location,
      batteryLevel: requestData.batteryLevel,
      status: requestData.status || 'online',
    };

    console.log(`Submitting sensor data for: ${requestData.sensorId}`);
    
    // Save the sensor data
    const savedData = await dynamoService.saveSensorData(sensorData);
    
    // Update sensor's last seen timestamp
    await dynamoService.updateSensor(requestData.sensorId, { lastSeen: now });
    
    // Check for alert conditions
    await checkAlertConditions(sensorData, sensorConfig);
    
    return createSuccessResponse(savedData, 'Sensor data submitted successfully');
  } catch (error) {
    console.error('Error submitting sensor data:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to submit sensor data', error);
  }
};

// Helper function to check alert conditions
async function checkAlertConditions(data: SensorData, config: any): Promise<void> {
  const alerts = [];
  
  // Check battery level
  if (data.batteryLevel < 20) {
    alerts.push({
      id: `alert-${Date.now()}-battery`,
      sensorId: data.sensorId,
      sensorName: config.name,
      alertType: 'battery_low' as const,
      message: `Battery level is ${data.batteryLevel}% (below 20%)`,
      severity: data.batteryLevel < 10 ? 'critical' as const : 'high' as const,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  // Check threshold values
  if (config.alertThreshold !== undefined) {
    if (data.sensorType === 'temperature' && data.value > config.alertThreshold) {
      alerts.push({
        id: `alert-${Date.now()}-temp`,
        sensorId: data.sensorId,
        sensorName: config.name,
        alertType: 'threshold_exceeded' as const,
        message: `Temperature ${data.value}${data.unit} exceeds threshold ${config.alertThreshold}${data.unit}`,
        severity: 'medium' as const,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }
  
  // Check motion detection
  if (data.sensorType === 'motion' && data.value > 0) {
    alerts.push({
      id: `alert-${Date.now()}-motion`,
      sensorId: data.sensorId,
      sensorName: config.name,
      alertType: 'motion_detected' as const,
      message: `Motion detected in ${data.location}`,
      severity: 'low' as const,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  // Save alerts
  for (const alert of alerts) {
    try {
      await dynamoService.createAlert(alert);
      console.log(`Created alert: ${alert.id}`);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
}

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