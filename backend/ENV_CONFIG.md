# Environment Configuration Guide

## Overview
This application now uses **strict environment-only configuration** with **zero hardcoded fallbacks**. All configuration must be provided through environment variables.

## Required Environment Variables

### Database Configuration
- `MONGO_URI` - MongoDB connection string (required)
  - Format: `mongodb://...` or `mongodb+srv://...`

### Server Configuration
- `PORT` - Server port number (required)
  - Must be a positive integer
  - Example: `5000`, `5001`

- `NODE_ENV` - Application environment (required)
  - Valid values: `development`, `production`, `test`

### JWT Configuration
- `JWT_SECRET` - Secret key for JWT token signing (required)
  - Should be a long, random string
  - Minimum 32 characters recommended

- `JWT_EXPIRES_IN` - JWT token expiration time (required)
  - Format: `30d`, `24h`, `3600s`
  - Example: `30d` for 30 days

### CORS Configuration
- `CORS_ORIGIN` - Allowed CORS origins (required)
  - Format: `http://localhost:3000` or `https://yourdomain.com`
  - Multiple origins: `http://localhost:3000,https://yourdomain.com`

- `FRONTEND_URL` - Frontend application URL (required)
  - Format: `http://localhost:3000` or `https://yourdomain.com`

### Logging Configuration
- `LOG_LEVEL` - Application log level (required)
  - Valid values: `error`, `warn`, `info`, `debug`

## Environment Files

### Development (.env)
```env
# Database Configuration
MONGO_URI=mongodb+srv://your-connection-string

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
```

### Production (.env.production)
```env
# Database Configuration
MONGO_URI=mongodb+srv://your-production-connection-string

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com

# Logging Configuration
LOG_LEVEL=error
```

## Validation

### Automatic Validation
The application automatically validates all environment variables on startup:
- Checks for missing required variables
- Validates variable formats and values
- Exits with error if any issues are found

### Manual Validation
Run the validation script manually:
```bash
npm run validate-env
```

## Error Handling

### Missing Variables
If any required environment variable is missing, the application will:
1. Log detailed error messages
2. Exit with status code 1
3. Prevent server startup

### Invalid Values
If any environment variable has an invalid value, the application will:
1. Log specific validation errors
2. Exit with status code 1
3. Provide guidance on correct formats

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use different secrets** for different environments
3. **Rotate JWT secrets** regularly in production
4. **Use strong, random JWT secrets** (minimum 32 characters)
5. **Set appropriate log levels** for each environment

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Run `npm run validate-env` to check configuration
   - Ensure all required variables are set
   - Check variable formats match requirements

2. **JWT errors**
   - Verify `JWT_SECRET` is set and not empty
   - Ensure `JWT_EXPIRES_IN` uses valid format

3. **CORS errors**
   - Check `CORS_ORIGIN` and `FRONTEND_URL` are valid URLs
   - Ensure URLs match your frontend application

4. **Database connection errors**
   - Verify `MONGO_URI` is a valid MongoDB connection string
   - Test database connectivity separately

### Getting Help

If you encounter issues:
1. Run the validation script: `npm run validate-env`
2. Check the application logs for specific error messages
3. Verify your .env file matches the required format
4. Ensure no trailing spaces or special characters in variable values

## Migration from Fallbacks

This update removes all hardcoded fallbacks. If you're upgrading:
1. Ensure all required environment variables are set
2. Run `npm run validate-env` to verify configuration
3. Test in development before deploying to production
4. Update any deployment scripts to include environment validation