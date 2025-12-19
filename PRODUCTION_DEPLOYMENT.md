# RayERP Production Deployment Guide

## 🚀 Production Readiness Checklist

### ✅ Backend Production Features
- **Enhanced Security**: Rate limiting, input validation, sanitization
- **Comprehensive Logging**: Structured logging with Winston
- **Error Handling**: Graceful error handling with proper HTTP status codes
- **Database Optimization**: Production-ready indexes and query optimization
- **Health Monitoring**: Health checks and metrics endpoints
- **Data Validation**: Express-validator middleware for all inputs
- **Performance**: Caching, compression, and optimized queries

### ✅ Contact System Production Features
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive validation for all contact operations
- **Data Sanitization**: Phone number normalization, email validation
- **Search Optimization**: Weighted text search with performance indexes
- **Health Monitoring**: Real-time health checks and metrics
- **Duplicate Prevention**: Prevents duplicate contacts by phone/email
- **Audit Logging**: All contact operations are logged
- **Error Recovery**: Graceful error handling with detailed logging

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rayerp?retryWrites=true&w=majority
NODE_ENV=production

# Security
JWT_SECRET=your-super-secure-256-bit-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# Logging
LOG_LEVEL=info

# Performance
REDIS_URL=redis://localhost:6379 # Optional for caching
```

### Frontend Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NODE_ENV=production
```

## 🏗️ Deployment Steps

### 1. Backend Deployment

```bash
# Build for production
cd backend
npm run build:prod

# Start production server
npm run start:prod
```

### 2. Frontend Deployment

```bash
# Build for production
cd frontend
npm run build

# Start production server
npm start
```

### 3. Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose ps
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- **Backend Health**: `GET /api/health`
- **Contact System Health**: `GET /api/contacts/health`
- **Contact Metrics**: `GET /api/contacts/metrics` (requires auth)

### Health Check Response Format

```json
{
  "success": true,
  "data": {
    "status": "healthy", // healthy | degraded | unhealthy
    "totalContacts": 1250,
    "activeContacts": 1180,
    "customerContacts": 450,
    "responseTime": 125,
    "lastChecked": "2024-01-15T10:30:00.000Z",
    "errors": [] // Only present if issues detected
  }
}
```

## 🔒 Security Features

### Contact System Security
- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control with visibility levels
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: MongoDB with proper query sanitization
- **XSS Prevention**: Input sanitization and output encoding

### Security Headers
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Rate limiting for API endpoints
- Request size limits

## 📈 Performance Optimizations

### Database Optimizations
- **Indexes**: Optimized compound indexes for common queries
- **Text Search**: Weighted full-text search with proper indexing
- **Query Optimization**: Lean queries and proper field selection
- **Connection Pooling**: MongoDB connection pooling
- **Caching**: Optional Redis caching for frequently accessed data

### API Optimizations
- **Compression**: Gzip compression for responses
- **Pagination**: Efficient pagination with limits
- **Field Selection**: Only return required fields
- **Batch Operations**: Support for bulk operations

## 🚨 Error Handling & Logging

### Error Response Format
```json
{
  "success": false,
  "message": "User-friendly error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Logging Levels
- **ERROR**: System errors, failed operations
- **WARN**: Performance issues, validation failures
- **INFO**: Successful operations, system events
- **DEBUG**: Detailed debugging information (dev only)

## 📋 Maintenance Tasks

### Daily Tasks
- Monitor health check endpoints
- Review error logs
- Check system performance metrics

### Weekly Tasks
- Database performance analysis
- Security audit logs review
- Backup verification

### Monthly Tasks
- Update dependencies
- Security vulnerability scan
- Performance optimization review

## 🔄 Backup & Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)

# Automated backup script
0 2 * * * /scripts/backup-database.sh
```

### File Backup
```bash
# Application files backup
tar -czf /backup/rayerp-$(date +%Y%m%d).tar.gz /app

# Automated file backup
0 3 * * 0 /scripts/backup-files.sh
```

## 📞 Support & Troubleshooting

### Common Issues

1. **High Response Times**
   - Check database indexes
   - Monitor connection pool
   - Review slow query logs

2. **Authentication Failures**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Review CORS configuration

3. **Database Connection Issues**
   - Verify MongoDB URI
   - Check network connectivity
   - Monitor connection pool metrics

### Log Locations
- **Application Logs**: `/app/logs/`
- **Error Logs**: `/app/logs/error.log`
- **Access Logs**: `/app/logs/access.log`

### Monitoring Commands
```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs rayerp-backend

# Monitor system resources
htop

# Check database connections
mongo --eval "db.adminCommand('connPoolStats')"
```

## 🎯 Performance Benchmarks

### Expected Performance
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms (average)
- **Contact Search**: < 150ms (full-text search)
- **Health Check**: < 50ms
- **Concurrent Users**: 1000+ simultaneous users

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

---

**RayERP Contact System - Production Ready ✅**

The contact system is now production-ready with comprehensive security, monitoring, performance optimizations, and error handling. All endpoints are validated, rate-limited, and properly logged for production use.