import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import DynamoDBService from '../services/dynamodb';
import { 
  SensorConfig, 
  CreateSensorRequest, 
  UpdateSensorRequest,
  ApiResponse,
  ApiError 
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

// GET /sensors - List all sensors
export const getSensors = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Getting all sensors');
    
    const sensors = await dynamoService.getAllSensors();
    
    return createSuccessResponse(sensors, `Retrieved ${sensors.length} sensors`);
  } catch (error) {
    console.error('Error getting sensors:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve sensors', error);
  }
};

// GET /sensors/{sensorId} - Get specific sensor
export const getSensor = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sensorId = event.pathParameters?.sensorId;
    
    if (!sensorId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Sensor ID is required');
    }

    console.log(`Getting sensor: ${sensorId}`);
    
    const sensor = await dynamoService.getSensor(sensorId);
    
    if (!sensor) {
      return createErrorResponse(404, 'SENSOR_NOT_FOUND', `Sensor ${sensorId} not found`);
    }
    
    return createSuccessResponse(sensor);
  } catch (error) {
    console.error('Error getting sensor:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve sensor', error);
  }
};

// POST /sensors - Create new sensor
export const createSensor = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'MISSING_BODY', 'Request body is required');
    }

    const requestData: CreateSensorRequest = JSON.parse(event.body);
    
    // Validate required fields
    if (!requestData.name || !requestData.sensorType || !requestData.location) {
      return createErrorResponse(400, 'MISSING_FIELDS', 'Name, sensorType, and location are required');
    }

    const sensorId = uuidv4();
    const now = new Date().toISOString();
    
    const sensor: SensorConfig = {
      sensorId,
      name: requestData.name,
      sensorType: requestData.sensorType,
      location: requestData.location,
      minValue: requestData.minValue,
      maxValue: requestData.maxValue,
      alertThreshold: requestData.alertThreshold,
      isActive: true,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    };

    console.log(`Creating sensor: ${sensorId}`);
    
    const createdSensor = await dynamoService.createSensor(sensor);
    
    return createSuccessResponse(createdSensor, 'Sensor created successfully');
  } catch (error) {
    console.error('Error creating sensor:', error);
    
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return createErrorResponse(409, 'SENSOR_EXISTS', 'Sensor already exists');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to create sensor', error);
  }
};

// PUT /sensors/{sensorId} - Update sensor
export const updateSensor = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sensorId = event.pathParameters?.sensorId;
    
    if (!sensorId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Sensor ID is required');
    }

    if (!event.body) {
      return createErrorResponse(400, 'MISSING_BODY', 'Request body is required');
    }

    const updates: UpdateSensorRequest = JSON.parse(event.body);
    
    console.log(`Updating sensor: ${sensorId}`);
    
    const updatedSensor = await dynamoService.updateSensor(sensorId, updates);
    
    return createSuccessResponse(updatedSensor, 'Sensor updated successfully');
  } catch (error) {
    console.error('Error updating sensor:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to update sensor', error);
  }
};

// DELETE /sensors/{sensorId} - Delete sensor
export const deleteSensor = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sensorId = event.pathParameters?.sensorId;
    
    if (!sensorId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Sensor ID is required');
    }

    console.log(`Deleting sensor: ${sensorId}`);
    
    await dynamoService.deleteSensor(sensorId);
    
    return createSuccessResponse(null, 'Sensor deleted successfully');
  } catch (error) {
    console.error('Error deleting sensor:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to delete sensor', error);
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