import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { 
  SensorData, 
  SensorConfig, 
  Alert, 
  SensorDataRecord, 
  SensorConfigRecord, 
  AlertRecord,
  TimeRange 
} from '../types/sensor';

class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'iot-dashboard-table';
  }

  // Sensor Configuration Methods
  async createSensor(sensor: SensorConfig): Promise<SensorConfig> {
    const record: SensorConfigRecord = {
      ...sensor,
      pk: `SENSOR#${sensor.sensorId}`,
      sk: 'CONFIG',
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: record,
      ConditionExpression: 'attribute_not_exists(pk)',
    }));

    return sensor;
  }

  async getSensor(sensorId: string): Promise<SensorConfig | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        pk: `SENSOR#${sensorId}`,
        sk: 'CONFIG',
      },
    }));

    if (!result.Item) {
      return null;
    }

    const { pk: _pk, sk: _sk, ...sensor } = result.Item as SensorConfigRecord;
    return sensor as SensorConfig;
  }

  async updateSensor(sensorId: string, updates: Partial<SensorConfig>): Promise<SensorConfig> {
    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    }

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: {
        pk: `SENSOR#${sensorId}`,
        sk: 'CONFIG',
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    const { pk: _pk, sk: _sk, ...sensor } = result.Attributes as SensorConfigRecord;
    return sensor as SensorConfig;
  }

  async deleteSensor(sensorId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: {
        pk: `SENSOR#${sensorId}`,
        sk: 'CONFIG',
      },
    }));
  }

  async getAllSensors(): Promise<SensorConfig[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'sk = :sk',
      ExpressionAttributeValues: {
        ':sk': 'CONFIG',
      },
    }));

    return (result.Items || []).map(item => {
      const { pk: _pk, sk: _sk, ...sensor } = item as SensorConfigRecord;
      return sensor as SensorConfig;
    });
  }

  // Sensor Data Methods
  async saveSensorData(data: SensorData): Promise<SensorData> {
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days TTL
    
    const record: SensorDataRecord = {
      ...data,
      pk: `SENSOR#${data.sensorId}`,
      sk: `DATA#${data.timestamp}`,
      ttl,
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: record,
    }));

    return data;
  }

  async getSensorData(sensorId: string, timeRange: TimeRange = '24h'): Promise<SensorData[]> {
    const now = new Date();
    const startTime = this.getStartTimeForRange(now, timeRange);

    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk AND sk BETWEEN :startSk AND :endSk',
      ExpressionAttributeValues: {
        ':pk': `SENSOR#${sensorId}`,
        ':startSk': `DATA#${startTime.toISOString()}`,
        ':endSk': `DATA#${now.toISOString()}`,
      },
      ScanIndexForward: true, // Sort by timestamp ascending
    }));

    return (result.Items || []).map(item => {
      const { pk: _pk, sk: _sk, ttl: _ttl, ...data } = item as SensorDataRecord;
      return data as SensorData;
    });
  }

  async getLatestSensorData(sensorId: string): Promise<SensorData | null> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `SENSOR#${sensorId}`,
        ':skPrefix': 'DATA#',
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const { pk: _pk, sk: _sk, ttl: _ttl, ...data } = result.Items[0] as SensorDataRecord;
    return data as SensorData;
  }

  // Alert Methods
  async createAlert(alert: Alert): Promise<Alert> {
    const record: AlertRecord = {
      ...alert,
      pk: `ALERT#${alert.id}`,
      sk: `ALERT#${alert.timestamp}`,
      gsi1pk: `SENSOR#${alert.sensorId}`,
      gsi1sk: `ALERT#${alert.timestamp}`,
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: record,
    }));

    return alert;
  }

  async getAlerts(limit: number = 50): Promise<Alert[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(pk, :pkPrefix)',
      ExpressionAttributeValues: {
        ':pkPrefix': 'ALERT#',
      },
      Limit: limit,
    }));

    return (result.Items || []).map(item => {
      const { pk: _pk, sk: _sk, gsi1pk: _gsi1pk, gsi1sk: _gsi1sk, ...alert } = item as AlertRecord;
      return alert as Alert;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAlertsBySensor(sensorId: string, limit: number = 20): Promise<Alert[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `SENSOR#${sensorId}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    }));

    return (result.Items || []).map(item => {
      const { pk: _pk, sk: _sk, gsi1pk: _gsi1pk, gsi1sk: _gsi1sk, ...alert } = item as AlertRecord;
      return alert as Alert;
    });
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<Alert> {
    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: {
        pk: `ALERT#${alertId}`,
        sk: `ALERT#${alertId}`, // Assuming alertId contains timestamp
      },
      UpdateExpression: 'SET acknowledged = :acknowledged, acknowledgedAt = :acknowledgedAt, acknowledgedBy = :acknowledgedBy',
      ExpressionAttributeValues: {
        ':acknowledged': true,
        ':acknowledgedAt': new Date().toISOString(),
        ':acknowledgedBy': acknowledgedBy || 'system',
      },
      ReturnValues: 'ALL_NEW',
    }));

    const { pk: _pk, sk: _sk, gsi1pk: _gsi1pk, gsi1sk: _gsi1sk, ...alert } = result.Attributes as AlertRecord;
    return alert as Alert;
  }

  // Utility Methods
  private getStartTimeForRange(now: Date, timeRange: TimeRange): Date {
    const startTime = new Date(now);
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(startTime.getHours() - 6);
        break;
      case '24h':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      default:
        startTime.setDate(startTime.getDate() - 1);
    }
    
    return startTime;
  }
}

export default DynamoDBService; 