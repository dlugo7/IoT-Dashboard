import { APIGatewayProxyEvent } from 'aws-lambda';

// Environment-based logging control
export const isProduction = process.env.NODE_ENV === 'production';
export const logLevel = process.env.LOG_LEVEL || (isProduction ? 'error' : 'debug');

// Secure logging utility that respects environment
export const secureLog = {
  debug: (message: string, data?: any) => {
    if (!isProduction && logLevel === 'debug') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    if (!isProduction || ['info', 'debug'].includes(logLevel)) {
      console.log(`[INFO] ${message}`, data ? sanitizeLogData(data) : '');
    }
  },
  warn: (message: string, data?: any) => {
    if (['warn', 'info', 'debug'].includes(logLevel)) {
      console.warn(`[WARN] ${message}`, data ? sanitizeLogData(data) : '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? sanitizeLogData(error) : '');
  }
};

// Sanitize sensitive data from logs
function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    return data.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
               .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REDACTED]')
               .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'auth'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  return data;
}

// Input validation utilities
export const validateInput = {
  sensorId: (id: string): boolean => {
    return typeof id === 'string' && 
           id.length > 0 && 
           id.length <= 100 && 
           /^[a-zA-Z0-9-_]+$/.test(id);
  },
  
  alertId: (id: string): boolean => {
    return typeof id === 'string' && 
           id.length > 0 && 
           id.length <= 100 && 
           /^[a-zA-Z0-9-_]+$/.test(id);
  },
  
  sensorValue: (value: number): boolean => {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value) && 
           value >= -1000 && 
           value <= 10000;
  },
  
  batteryLevel: (level: number): boolean => {
    return typeof level === 'number' && 
           level >= 0 && 
           level <= 100;
  },
  
  timeRange: (range: string): boolean => {
    const validRanges = ['1h', '6h', '24h', '7d', '30d'];
    return validRanges.includes(range);
  },
  
  limit: (limit: number): boolean => {
    return typeof limit === 'number' && 
           limit > 0 && 
           limit <= 1000;
  }
};

// Sanitize and validate request data
export function sanitizeAndValidateRequest(event: APIGatewayProxyEvent): {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
} {
  const errors: string[] = [];
  
  // Validate HTTP method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(event.httpMethod)) {
    errors.push('Invalid HTTP method');
  }
  
  // Validate headers
  const userAgent = event.headers['User-Agent'] || event.headers['user-agent'];
  if (userAgent && userAgent.length > 500) {
    errors.push('User-Agent header too long');
  }
  
  // Check for potential injection attempts in query parameters
  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value && containsSqlInjection(value)) {
        errors.push(`Potentially malicious content in query parameter: ${key}`);
      }
    }
  }
  
  // Validate request body size
  if (event.body && event.body.length > 1024 * 1024) { // 1MB limit
    errors.push('Request body too large');
  }
  
  let sanitizedData = null;
  
  // Parse and sanitize JSON body
  if (event.body) {
    try {
      const parsed = JSON.parse(event.body);
      sanitizedData = sanitizeObject(parsed);
    } catch (error) {
      errors.push('Invalid JSON in request body');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// Basic SQL injection detection
function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\*\/|\bxp_)/i,
    /(\bEXEC\s*\(|\bSP_)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Sanitize object by removing potentially dangerous content
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip potentially dangerous keys
    if (key.startsWith('__') || key.includes('prototype')) {
      continue;
    }
    
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Rate limiting helper (basic implementation)
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Create a global rate limiter instance
export const globalRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX || '100'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
);

// Security headers helper
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

// Request ID generator for tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
} 