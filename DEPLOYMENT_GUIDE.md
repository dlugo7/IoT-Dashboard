# 🚀 Professional Deployment Guide

## 📋 Prerequisites

### Required Tools & Accounts
- ✅ **AWS Account** with administrative access
- ✅ **AWS CLI v2+** installed and configured
- ✅ **Node.js 20+** with npm package manager
- ✅ **Git** for version control

### Verify Installation
```bash
# Verify all prerequisites
node --version    # Should be 20+
aws --version     # Should be 2.x
git --version     # Latest version recommended
```

---

## ⚙️ AWS Configuration

### 1. AWS CLI Setup
If AWS CLI is not installed, download from: [AWS CLI Installation Guide](https://aws.amazon.com/cli/)

### 2. Configure AWS Credentials
```bash
aws configure
```

**Required Information:**
- **AWS Access Key ID**: From AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Same location as above
- **Default region**: `us-east-1` (recommended for optimal performance)
- **Output format**: `json`

### 3. Verify Configuration
```bash
aws sts get-caller-identity
# Expected output: Account ID, User ARN, User ID
```

---

## 🏗️ Infrastructure Deployment

### 1. CDK Bootstrap (First-Time Setup)
Bootstrap CDK in your AWS account (required once per account/region):

```bash
# Get your AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK
npx cdk bootstrap aws://$ACCOUNT_ID/us-east-1
```

### 2. Deploy Backend Infrastructure
```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Preview deployment (recommended)
npx cdk synth

# Deploy to AWS
npx cdk deploy --require-approval never
```

**Infrastructure Created:**
- 📊 DynamoDB table for sensor data with auto-scaling
- ⚡ Lambda functions for API endpoints
- 🌐 API Gateway with CORS and throttling
- 🔐 IAM roles with least-privilege permissions
- 📈 CloudWatch logs and monitoring

### 3. Capture API Endpoint
After successful deployment, note the API Gateway URL:
```
✅ IotDashboardStack.ApiGatewayUrl = https://abc123.execute-api.us-east-1.amazonaws.com/prod/
```

---

## 🎨 Frontend Deployment

### 1. Configure Environment
Create `frontend/.env.production`:
```env
VITE_API_ENDPOINT=https://YOUR-API-GATEWAY-URL/prod
VITE_AWS_REGION=us-east-1
VITE_ENVIRONMENT=production
```

### 2. Build & Deploy Frontend
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Frontend is automatically deployed via CDK
```

---

## ✅ System Verification

### 1. Health Check
Test the API health endpoint:
```bash
curl https://YOUR-API-GATEWAY-URL/prod/health
# Expected: {"status": "healthy", "timestamp": "..."}
```

### 2. Create Test Sensor
```bash
curl -X POST https://YOUR-API-GATEWAY-URL/prod/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Temperature Sensor",
    "sensorType": "temperature",
    "location": "Server Room",
    "alertThreshold": 25
  }'
```

### 3. Submit Test Data
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

### 4. Verify Dashboard
```bash
curl https://YOUR-API-GATEWAY-URL/prod/dashboard/stats
# Expected: JSON with system statistics
```

---

## 📊 Monitoring & Debugging

### CloudWatch Logs
```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/IotDashboardStack"

# View recent logs
aws logs tail /aws/lambda/IotDashboardStack-GetSensorsFunction --follow
```

### API Gateway Monitoring
```bash
# Check API Gateway
aws apigateway get-rest-apis --query "items[?name=='IoT Dashboard API']"

# View API usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value="IoT Dashboard API" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### DynamoDB Status
```bash
# Check table status
aws dynamodb describe-table --table-name iot-dashboard-table

# View item count
aws dynamodb scan --table-name iot-dashboard-table --select COUNT
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Permission Errors
**Symptom**: Access denied during deployment
**Solution**: 
```bash
# Verify IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR-USERNAME
```

#### Region Mismatch
**Symptom**: Resources not found
**Solution**: Ensure all services are in the same AWS region
```bash
# Check current region
aws configure get region

# Set region if needed
aws configure set region us-east-1
```

#### CDK Bootstrap Issues
**Symptom**: CDK deployment fails with bootstrap error
**Solution**: 
```bash
# Re-bootstrap with verbose output
npx cdk bootstrap --verbose
```

#### CORS Errors
**Symptom**: Browser console shows CORS errors
**Solution**: CORS is configured in CDK stack. Check:
1. API Gateway CORS settings
2. CloudFront distribution configuration
3. Browser developer tools for specific error details

### Useful Debugging Commands
```bash
# Show CDK differences before deployment
npx cdk diff

# List all CDK stacks
npx cdk list

# View synthesized CloudFormation template
npx cdk synth > cloudformation-template.yaml

# Destroy infrastructure (cleanup)
npx cdk destroy
```

---

## 💰 Cost Analysis

### Expected Monthly Costs (Development/Demo Usage)

| Service | Usage | Monthly Cost |
|---------|--------|--------------|
| **DynamoDB** | 1M read/write requests | ~$1.25 |
| **Lambda** | 1M requests, 512MB | ~$2.00 |
| **API Gateway** | 1M API calls | ~$3.50 |
| **CloudWatch** | Standard logging | ~$0.50 |
| **CloudFront** | 1GB transfer | ~$0.10 |

**Total Estimated Cost**: ~$7-10/month for development usage

### Cost Optimization Tips
- Use DynamoDB On-Demand pricing for variable workloads
- Enable Lambda Provisional Concurrency only for production
- Set up CloudWatch billing alerts
- Use AWS Cost Explorer for detailed cost analysis

---

## 🛡️ Security Best Practices

### Pre-Production Security Checklist
- [ ] **Enable AWS CloudTrail** for audit logging
- [ ] **Configure AWS Config** for compliance monitoring  
- [ ] **Set up AWS GuardDuty** for threat detection
- [ ] **Implement AWS Secrets Manager** for sensitive data
- [ ] **Configure AWS WAF** for API protection
- [ ] **Enable VPC Flow Logs** for network monitoring
- [ ] **Set up billing alerts** to prevent unexpected charges

### Environment Variables Security
```bash
# Development Environment
export AWS_PROFILE=dev-profile
export NODE_ENV=development

# Never commit these to version control:
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

---

## 🏗️ Production Considerations

### Scalability Enhancements
1. **Custom Domain Setup**
   - Configure Route 53 hosted zone
   - Set up SSL certificate with AWS Certificate Manager
   - Update CloudFront distribution with custom domain

2. **Authentication Implementation**
   - Deploy AWS Cognito User Pool
   - Configure API Gateway authorizers
   - Update frontend with authentication flows

3. **Enhanced Monitoring**
   - Create CloudWatch dashboards
   - Set up SNS alerts for critical metrics
   - Configure AWS X-Ray for distributed tracing

4. **Data Backup & Recovery**
   - Enable DynamoDB point-in-time recovery
   - Set up automated backup schedules
   - Test disaster recovery procedures

### CI/CD Pipeline Setup
```yaml
# Example GitHub Actions workflow
name: Deploy IoT Dashboard
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Deploy to AWS
        run: npm run deploy
```

---

## 🎉 Deployment Success Checklist

### ✅ Verification Steps
- [ ] API Gateway endpoint responding correctly
- [ ] Frontend loading without errors
- [ ] CloudWatch logs showing activity
- [ ] DynamoDB table created with correct schema
- [ ] Test sensor creation and data submission working
- [ ] Dashboard displaying real-time data
- [ ] Mobile responsiveness verified
- [ ] All environment variables configured properly

### 📱 Access Your Dashboard
- **Production URL**: Available after CloudFront deployment
- **API Documentation**: Swagger/OpenAPI specs available
- **Monitoring Dashboard**: CloudWatch metrics and alarms
- **Cost Tracking**: AWS Cost Explorer integration

---

## 📞 Support & Resources

### Documentation Links
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [React Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

### Getting Help
- **AWS Support**: Available through AWS Console
- **Community Forums**: AWS Developer Forums, Stack Overflow
- **Documentation**: Comprehensive guides in this repository

---

<div align="center">

**🚀 Your IoT Dashboard is now successfully deployed and ready for production use!**

*For additional support or questions, refer to the project documentation or AWS support resources.*

</div> 