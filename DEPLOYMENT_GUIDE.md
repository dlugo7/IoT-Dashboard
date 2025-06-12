# 🚀 AWS Deployment Guide - IoT Dashboard

## Prerequisites Checklist

- ✅ AWS Account created
- ⏳ AWS CLI installed and configured
- ✅ Node.js 18+ installed
- ✅ CDK CLI available (using npx)

## Step 1: AWS CLI Configuration

### Install AWS CLI (if not installed)
Download from: https://aws.amazon.com/cli/

### Configure AWS Credentials
```bash
aws configure
```

**You'll need:**
- AWS Access Key ID (from AWS Console → IAM → Users → Security Credentials)
- AWS Secret Access Key (same location)
- Default region: `us-east-1` (recommended)
- Output format: `json`

### Verify Configuration
```bash
aws sts get-caller-identity
```
This should show your AWS account details.

## Step 2: CDK Bootstrap (First Time Only)

Bootstrap CDK in your AWS account:
```bash
npx cdk bootstrap aws://YOUR-ACCOUNT-ID/us-east-1
```

**To find your Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

## Step 3: Deploy Backend Infrastructure

### Build the TypeScript
```bash
npm run build
```

### Preview the deployment
```bash
npx cdk synth
```

### Deploy to AWS
```bash
npx cdk deploy
```

**This will create:**
- DynamoDB table for sensor data
- Lambda functions for API endpoints
- API Gateway for REST API
- IAM roles and permissions
- CloudWatch logs

### Get the API Endpoint
After deployment, CDK will output:
```
IotDashboardStack.ApiGatewayUrl = https://abc123.execute-api.us-east-1.amazonaws.com/prod/
```

## Step 4: Configure Frontend

### Create Environment File
Create `frontend/.env.local`:
```env
VITE_API_ENDPOINT=https://YOUR-API-GATEWAY-URL/prod
VITE_AWS_REGION=us-east-1
```

### Test the Frontend
```bash
cd ../frontend
npm run dev
```

## Step 5: Test the System

### Create a Test Sensor
```bash
curl -X POST https://YOUR-API-GATEWAY-URL/prod/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Temperature",
    "sensorType": "temperature",
    "location": "Living Room",
    "alertThreshold": 25
  }'
```

### Submit Test Data
```bash
curl -X POST https://YOUR-API-GATEWAY-URL/prod/sensors/data \
  -H "Content-Type: application/json" \
  -d '{
    "sensorId": "SENSOR-ID-FROM-ABOVE",
    "value": 22.5,
    "unit": "°C",
    "batteryLevel": 85
  }'
```

### Check Dashboard Stats
```bash
curl https://YOUR-API-GATEWAY-URL/prod/dashboard/stats
```

## Step 6: Monitor and Debug

### View CloudWatch Logs
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/IotDashboardStack"
```

### Check API Gateway
```bash
aws apigateway get-rest-apis --query "items[?name=='IoT Dashboard API']"
```

### DynamoDB Table
```bash
aws dynamodb describe-table --table-name iot-dashboard-table
```

## Troubleshooting

### Common Issues:

1. **Permission Errors**
   - Ensure your AWS user has sufficient permissions
   - Consider using AdministratorAccess for initial setup

2. **Region Mismatch**
   - Ensure all services are in the same region
   - Check your AWS CLI default region

3. **CDK Bootstrap Not Done**
   - Run `npx cdk bootstrap` first

4. **API CORS Issues**
   - CORS is configured in the CDK stack
   - Check browser developer tools for errors

### Useful Commands:

```bash
# Check what's deployed
npx cdk list

# Show differences before deploy
npx cdk diff

# Destroy everything (cleanup)
npx cdk destroy

# View CloudFormation template
npx cdk synth > template.yaml
```

## Security Best Practices

1. **Never commit AWS credentials to git**
2. **Use IAM roles with minimal permissions in production**
3. **Enable CloudTrail for auditing**
4. **Set up billing alerts**

## Cost Estimation

**Monthly costs (light usage):**
- DynamoDB: ~$1-5 (pay per request)
- Lambda: ~$0-2 (first 1M requests free)
- API Gateway: ~$1-3 (first 1M requests ~$3.50)
- CloudWatch Logs: ~$0.50

**Total: ~$2-10/month for development/demo usage**

## Production Considerations

1. **Custom Domain**: Set up Route 53 and Certificate Manager
2. **Authentication**: Add AWS Cognito
3. **Monitoring**: Set up CloudWatch dashboards
4. **Backup**: Enable point-in-time recovery for DynamoDB
5. **Automation**: Consider setting up automated deployment when needed

---

## 🎉 Success Checklist

- ✅ Backend deployed to AWS
- ✅ API Gateway URL obtained
- ✅ Frontend configured with API endpoint
- ✅ Test sensor created
- ✅ Test data submitted
- ✅ Dashboard showing real data

**Your IoT Dashboard is now live on AWS! 🚀** 