# Backend Dockerfile for RayERP
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 rayerp

# Copy built application
COPY --from=builder --chown=rayerp:nodejs /app/dist ./dist
COPY --from=builder --chown=rayerp:nodejs /app/package*.json ./
COPY --from=deps --chown=rayerp:nodejs /app/node_modules ./node_modules

# Copy scripts and other necessary files
COPY --from=builder --chown=rayerp:nodejs /app/scripts ./scripts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER rayerp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]