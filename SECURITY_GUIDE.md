# RayERP Security Guide

## Overview
This document outlines the security measures implemented in RayERP and provides guidelines for secure deployment and operation.

## Security Fixes Applied

### 1. Environment Variables Security
- **Issue**: Hardcoded credentials in environment files
- **Fix**: Replaced with placeholder values and created `.env.example` templates
- **Action Required**: 
  - Copy `.env.example` to `.env` in both backend and frontend
  - Fill in actual values for your environment
  - Never commit `.env` files to version control

### 2. Authentication & Authorization
- **Issue**: Dangerous development bypass allowing code execution
- **Fix**: Removed insecure authentication bypass
- **Implementation**: Proper RBAC (Role-Based Access Control) middleware

### 3. Input Validation & Sanitization
- **Issue**: Unsanitized user input leading to XSS and injection attacks
- **Fix**: Comprehensive validation middleware
- **Features**:
  - Input sanitization to prevent XSS
  - MongoDB ID validation
  - File upload validation
  - Request size limits

### 4. CSRF Protection
- **Issue**: Cross-Site Request Forgery vulnerabilities
- **Fix**: CSRF token implementation
- **Usage**: All state-changing requests require valid CSRF tokens

### 5. File Upload Security
- **Issue**: Path traversal and malicious file uploads
- **Fix**: Secure file handling
- **Features**:
  - Filename sanitization
  - File type validation
  - Size limits (10MB)
  - Secure storage paths

### 6. Code Execution Prevention
- **Issue**: `eval()` function allowing arbitrary code execution
- **Fix**: Removed `eval()` and implemented safe alternatives

## Security Configuration

### Environment Variables
```bash
# Required Security Variables
JWT_SECRET=<generate-with-crypto.randomBytes(64).toString('hex')>
MONGO_URI=<your-secure-mongodb-connection>
NODE_ENV=production
CORS_ORIGIN=<your-frontend-domain>
```

### Generate Secure JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### MongoDB Security
1. Use MongoDB Atlas or secure self-hosted instance
2. Enable authentication
3. Use connection string with credentials
4. Enable SSL/TLS encryption

### HTTPS Configuration
- Always use HTTPS in production
- Configure SSL certificates
- Enable HSTS headers
- Use secure cookies

## Deployment Security Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] JWT secret generated and set
- [ ] Database credentials secured
- [ ] CORS origins configured
- [ ] File upload directories secured
- [ ] SSL certificates installed

### Production Settings
- [ ] NODE_ENV=production
- [ ] Debug mode disabled
- [ ] Error messages sanitized
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database backups automated

### Monitoring & Logging
- [ ] Security event logging enabled
- [ ] Failed login attempt monitoring
- [ ] File upload monitoring
- [ ] Database query logging
- [ ] Error tracking configured

## Security Headers

The application should include these security headers:

```javascript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## User Permissions

### Default Roles
- **Admin**: Full system access
- **Finance Manager**: Finance module management
- **Finance User**: Finance module read/write
- **Viewer**: Read-only access

### Permission Structure
```
finance.view - View financial data
finance.manage - Create/edit financial records
finance.approve - Approve transactions
finance.post - Post journal entries
finance.import - Import data
admin.users - Manage users
admin.settings - System settings
```

## File Upload Security

### Allowed File Types
- Images: JPEG, PNG
- Documents: PDF
- Data: CSV

### Security Measures
- File size limits (10MB)
- Filename sanitization
- MIME type validation
- Virus scanning (recommended)
- Secure storage location

## Database Security

### Connection Security
- Use connection pooling
- Enable SSL/TLS
- Implement connection timeouts
- Use read/write splitting if applicable

### Query Security
- Parameterized queries only
- Input validation
- Query result limits
- Index optimization

## API Security

### Rate Limiting
- Implement per-user rate limits
- Different limits for different endpoints
- Temporary blocking for abuse

### Request Validation
- JSON schema validation
- Parameter sanitization
- Content-type validation
- Request size limits

## Incident Response

### Security Incident Checklist
1. Identify and contain the incident
2. Assess the scope and impact
3. Preserve evidence
4. Notify stakeholders
5. Implement fixes
6. Monitor for recurrence
7. Document lessons learned

### Emergency Contacts
- System Administrator: [Contact Info]
- Security Team: [Contact Info]
- Database Administrator: [Contact Info]

## Regular Security Tasks

### Daily
- Monitor security logs
- Check failed login attempts
- Review system alerts

### Weekly
- Update dependencies
- Review user access
- Check backup integrity

### Monthly
- Security patch updates
- Access review audit
- Penetration testing
- Backup restoration testing

## Compliance Considerations

### Data Protection
- Implement data encryption at rest
- Secure data transmission
- Regular data backups
- Data retention policies

### Audit Requirements
- Maintain audit logs
- User activity tracking
- Change management logs
- Access control reviews

## Contact Information

For security issues or questions:
- Email: security@rayerp.com
- Emergency: [Emergency Contact]
- Documentation: [Security Wiki URL]

## Version History

- v1.0 - Initial security implementation
- v1.1 - Added CSRF protection
- v1.2 - Enhanced file upload security
- v1.3 - Comprehensive validation middleware

---

**Note**: This security guide should be reviewed and updated regularly as new threats emerge and the system evolves.