# Docker Compose Usage Guide

## Available Compose Files

1. **docker-compose.base.yml** - MongoDB only
2. **docker-compose.backend.yml** - Backend API service
3. **docker-compose.frontend.yml** - Frontend application
4. **docker-compose.optional.yml** - Redis and Nginx services

## Usage Examples

### Start only MongoDB:
```bash
docker-compose -f docker-compose.base.yml up -d
```

### Start MongoDB + Backend:
```bash
docker-compose -f docker-compose.base.yml -f docker-compose.backend.yml up -d
```

### Start full application (MongoDB + Backend + Frontend):
```bash
docker-compose -f docker-compose.base.yml -f docker-compose.backend.yml -f docker-compose.frontend.yml up -d
```

### Start everything including optional services:
```bash
docker-compose -f docker-compose.base.yml -f docker-compose.backend.yml -f docker-compose.frontend.yml -f docker-compose.optional.yml up -d
```

### Production with Nginx:
```bash
docker-compose -f docker-compose.base.yml -f docker-compose.backend.yml -f docker-compose.frontend.yml -f docker-compose.optional.yml --profile production up -d
```

## Environment Variables
Create a `.env` file with:
```
MONGO_ROOT_PASSWORD=your_mongo_password
JWT_SECRET=your_jwt_secret
FRONTEND_HOST=http://localhost:3000
BACKEND_HOST=http://localhost:5000
```