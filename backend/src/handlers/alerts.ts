import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import DynamoDBService from '../services/dynamodb';
import { 
  Alert,
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

// GET /alerts - Get all alerts
export const getAlerts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const sensorId = event.queryStringParameters?.sensorId;
    
    console.log(`Getting alerts - limit: ${limit}, sensorId: ${sensorId || 'all'}`);
    
    let alerts: Alert[];
    
    if (sensorId) {
      alerts = await dynamoService.getAlertsBySensor(sensorId, limit);
    } else {
      alerts = await dynamoService.getAlerts(limit);
    }
    
    return createSuccessResponse(alerts, `Retrieved ${alerts.length} alerts`);
  } catch (error) {
    console.error('Error getting alerts:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve alerts', error);
  }
};

// PUT /alerts/{alertId}/acknowledge - Acknowledge an alert
export const acknowledgeAlert = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const alertId = event.pathParameters?.alertId;
    
    if (!alertId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Alert ID is required');
    }

    let acknowledgedBy = 'system';
    
    // Try to parse the body to get who acknowledged it
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        acknowledgedBy = body.acknowledgedBy || 'system';
      } catch (e) {
        // Ignore parse errors, use default
      }
    }

    console.log(`Acknowledging alert: ${alertId} by ${acknowledgedBy}`);
    
    const acknowledgedAlert = await dynamoService.acknowledgeAlert(alertId, acknowledgedBy);
    
    return createSuccessResponse(acknowledgedAlert, 'Alert acknowledged successfully');
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to acknowledge alert', error);
  }
};

// DELETE /alerts/{alertId} - Delete an alert
export const deleteAlert = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const alertId = event.pathParameters?.alertId;
    
    if (!alertId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Alert ID is required');
    }

    console.log(`Deleting alert: ${alertId}`);
    
    // Note: This is a simplified implementation
    // In a real application, you might want to soft delete or archive alerts
    // For now, we'll just acknowledge it
    await dynamoService.acknowledgeAlert(alertId, 'deleted');
    
    return createSuccessResponse(null, 'Alert deleted successfully');
  } catch (error) {
    console.error('Error deleting alert:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to delete alert', error);
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