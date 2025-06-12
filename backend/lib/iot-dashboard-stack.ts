import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class IotDashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'IotDashboardTable', {
      tableName: 'iot-dashboard-table',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Global Secondary Index for querying alerts by sensor
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions to Lambda
    table.grantReadWriteData(lambdaRole);

    // Common Lambda environment variables
    const lambdaEnvironment = {
      DYNAMODB_TABLE_NAME: table.tableName,
      NODE_OPTIONS: '--enable-source-maps',
    };

    // Lambda function for sensor operations
    const sensorsFunction = new lambda.Function(this, 'SensorsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/sensors.getSensors',
      code: lambda.Code.fromAsset('dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for sensor data operations
    const sensorDataFunction = new lambda.Function(this, 'SensorDataFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/sensorData.getSensorData',
      code: lambda.Code.fromAsset('dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for dashboard operations
    const dashboardFunction = new lambda.Function(this, 'DashboardFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/dashboard.getStats',
      code: lambda.Code.fromAsset('dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for alerts operations
    const alertsFunction = new lambda.Function(this, 'AlertsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/alerts.getAlerts',
      code: lambda.Code.fromAsset('dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'IotDashboardApi', {
      restApiName: 'IoT Dashboard API',
      description: 'API for IoT Dashboard application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // API Gateway integrations
    const sensorsIntegration = new apigateway.LambdaIntegration(sensorsFunction);
    const sensorDataIntegration = new apigateway.LambdaIntegration(sensorDataFunction);
    const dashboardIntegration = new apigateway.LambdaIntegration(dashboardFunction);
    const alertsIntegration = new apigateway.LambdaIntegration(alertsFunction);

    // API Routes
    // /sensors
    const sensorsResource = api.root.addResource('sensors');
    sensorsResource.addMethod('GET', sensorsIntegration);
    sensorsResource.addMethod('POST', sensorsIntegration);

    // /sensors/{sensorId}
    const sensorResource = sensorsResource.addResource('{sensorId}');
    sensorResource.addMethod('GET', sensorsIntegration);
    sensorResource.addMethod('PUT', sensorsIntegration);
    sensorResource.addMethod('DELETE', sensorsIntegration);

    // /sensors/{sensorId}/data
    const sensorDataResource = sensorResource.addResource('data');
    sensorDataResource.addMethod('GET', sensorDataIntegration);
    sensorDataResource.addMethod('POST', sensorDataIntegration);

    // /sensors/data/latest
    const latestDataResource = sensorsResource.addResource('data').addResource('latest');
    latestDataResource.addMethod('GET', sensorDataIntegration);

    // /dashboard
    const dashboardResource = api.root.addResource('dashboard');
    
    // /dashboard/stats
    const statsResource = dashboardResource.addResource('stats');
    statsResource.addMethod('GET', dashboardIntegration);

    // /dashboard/historical
    const historicalResource = dashboardResource.addResource('historical');
    historicalResource.addMethod('GET', dashboardIntegration);

    // /alerts
    const alertsResource = api.root.addResource('alerts');
    alertsResource.addMethod('GET', alertsIntegration);

    // /alerts/{alertId}
    const alertResource = alertsResource.addResource('{alertId}');
    alertResource.addMethod('DELETE', alertsIntegration);

    // /alerts/{alertId}/acknowledge
    const acknowledgeResource = alertResource.addResource('acknowledge');
    acknowledgeResource.addMethod('PUT', alertsIntegration);

    // Health check endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', dashboardIntegration);

    // Frontend hosting infrastructure
    // S3 bucket for hosting frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `iot-dashboard-frontend-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
      autoDeleteObjects: true, // For development
    });

    // CloudFront Origin Access Control
    const oac = new cloudfront.S3OriginAccessControl(this, 'FrontendOAC', {
      description: 'Origin Access Control for IoT Dashboard Frontend',
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      comment: 'IoT Dashboard Frontend Distribution',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only edge locations in US, Canada, and Europe
    });

    // Deploy frontend build to S3
    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 Bucket for Frontend',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL for Frontend',
    });

    new cdk.CfnOutput(this, 'FrontendS3Url', {
      value: frontendBucket.bucketWebsiteUrl,
      description: 'S3 Website URL for Frontend',
    });
  }
} 