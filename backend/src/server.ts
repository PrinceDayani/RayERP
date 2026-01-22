import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connectDB, createIndexes } from "./config/database";
import { cacheMiddleware } from "./middleware/cache.middleware";
import { paginationMiddleware } from "./middleware/pagination.middleware";
import http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";
import "express-async-errors";
import { setupSocketAuth, setupSocketHandlers } from "./socket";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV', 'CORS_ORIGIN', 'FRONTEND_URL', 'PORT', 'LOG_LEVEL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} environment variable is required`);
    process.exit(1);
  }
}

if (isNaN(Number(process.env.PORT))) {
  console.error('❌ PORT must be a valid number');
  process.exit(1);
}

import { logger } from "./utils/logger";
import routes from "./routes/index";
import assignmentRoutes from "./routes/assignment.routes";
import backupRoutes from "./routes/backupRoutes";
import errorMiddleware from "./middleware/error.middleware";

const app = express();
const server = http.createServer(app);

// Trust proxy for secure cookies and proxies
app.set("trust proxy", 1);

// Optimized rate limiting
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 100, // 100 requests per 10 seconds
  message: {
    error: 'Too many requests from this IP, please try again in 10 seconds.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks, static files, and in development
    return req.path === '/api/health' ||
      req.path.startsWith('/uploads/') ||
      process.env.NODE_ENV === 'development';
  },
});

app.use(limiter);

// Enhanced compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// CORS configuration
const allowedOrigins = [];

// Add origins from environment variables only
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').filter(Boolean));
}

// Add environment origins if they exist
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').filter(Boolean));
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(',').filter(Boolean));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control", "Pragma"],
  exposedHeaders: ["Set-Cookie", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  }
  next();
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Optimized body parsing middleware
app.use(express.json({
  limit: "10mb",
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({
  extended: true,
  limit: "10mb",
  parameterLimit: 1000
}));
app.use(cookieParser());

// Request logging middleware (temporary for debugging)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// Serve static files from public directory
app.use('/public', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Quick fix routes
// app.use("/api/fast", require('./routes/fast.routes'));

// Validation Jobs Routes
import validationJobsRoutes from "./routes/validationJobs.routes";
app.use("/api/validation-jobs", validationJobsRoutes);

// API Routes
app.use("/api", routes);
app.use("/api", assignmentRoutes);
app.use("/api/backup", backupRoutes);

// Salary Management Routes
import salaryRoutes from "./routes/salary.routes";
app.use("/api/salary", salaryRoutes);

// Employee Career Routes
import careerRoutes from "./routes/career.routes";
app.use("/api/career", careerRoutes);

// Achievement Routes
import achievementRoutes from "./routes/achievement.routes";
app.use("/api/achievements", achievementRoutes);

// Budget Module Routes (Modules 1-10) - Complete!
import budgetApprovalWorkflowRoutes from "./routes/budgetApprovalWorkflow.routes";
import budgetRevisionRoutes from "./routes/budgetRevision.routes";
import budgetTransferRoutes from "./routes/budgetTransfer.routes";
import budgetForecastRoutes from "./routes/budgetForecast.routes";
import budgetVarianceRoutes from "./routes/budgetVariance.routes";
import budgetCommentRoutes from "./routes/budgetComment.routes";
import budgetTemplateRoutes from "./routes/budgetTemplate.routes";
import budgetReportRoutes from "./routes/budgetReport.routes";
import budgetDashboardRoutes from "./routes/budgetDashboard.routes";

app.use("/api/budget-approvals", budgetApprovalWorkflowRoutes);
app.use("/api/budget-revisions", budgetRevisionRoutes);
app.use("/api/budget-transfers", budgetTransferRoutes);
app.use("/api/budget-forecasts", budgetForecastRoutes);
app.use("/api/budget-variances", budgetVarianceRoutes);
app.use("/api/budget-comments", budgetCommentRoutes);
app.use("/api/budget-templates", budgetTemplateRoutes);
app.use("/api/budget-reports", budgetReportRoutes);
app.use("/api/budget-dashboard", budgetDashboardRoutes);

// Catch-all for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found'
  });
});

// Error handling middleware
app.use(errorMiddleware);

// Optimized Socket.IO setup
const io = new SocketServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? true : allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: false,
  path: "/socket.io/",
  pingTimeout: 30000,
  pingInterval: 15000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // Reduced from 10MB to 1MB
  connectTimeout: 20000,
  perMessageDeflate: {
    threshold: 1024,
  }
});

// Setup socket authentication and handlers
setupSocketAuth(io);
setupSocketHandlers(io);

// Export for use in other files
export { io };
export default app;

// Initialize real-time systems
async function initializeRealTimeSystems() {
  try {
    // Initialize real-time admin emitter
    const { realTimeAdminEmitter } = await import('./utils/realTimeAdminEmitter');
    realTimeAdminEmitter.initialize(io);

    // Initialize real-time data emitter
    const { RealTimeEmitter } = await import('./utils/realTimeEmitter');
    RealTimeEmitter.initialize(io);
    RealTimeEmitter.startIntervals();

    // Initialize cron jobs
    const { initializeCronJobs } = await import('./utils/cronJobs');
    initializeCronJobs();

    // Initialize recurring job schedulers
    const { initializeSchedulers } = await import('./utils/recurringJobsScheduler');
    initializeSchedulers();

    // Initialize notification cleanup
    const { initializeNotificationCleanup } = await import('./utils/notificationCleanup');
    initializeNotificationCleanup();

    // Initialize task reminders
    const { initializeTaskReminders } = await import('./utils/taskReminders');
    initializeTaskReminders();

    // Initialize recurring tasks
    const { initializeRecurringTasks } = await import('./controllers/taskRecurringController');
    initializeRecurringTasks();

    // Initialize audit log cleanup
    const { initializeAuditLogCleanup } = await import('./utils/auditLogCleanup');
    initializeAuditLogCleanup();

    // Initialize budget cron jobs
    try {
      const budgetCronModule = await import('./utils/budgetCronJobs');
      if ((budgetCronModule as any).startBudgetCronJobs) {
        (budgetCronModule as any).startBudgetCronJobs();
      }
    } catch (err) {
      logger.warn('⚠️ Budget cron jobs not available');
    }

    // Initialize validation jobs for data consistency
    try {
      const { startValidationJobs } = await import('./jobs/validationJobs');
      startValidationJobs();
      logger.info('✅ Data consistency validation jobs started');
    } catch (err) {
      logger.warn('⚠️ Validation jobs could not be started:', err.message);
    }

    // Initialize session cleanup
    try {
      const { startSessionCleanup } = await import('./jobs/sessionCleanup');
      startSessionCleanup();
      logger.info('✅ Session cleanup cron job started (hourly)');
    } catch (err) {
      logger.warn('⚠️ Session cleanup could not be started:', err.message);
    }

    logger.info('✅ Real-time systems initialized');
    logger.info('✅ Budget cron jobs started');
    logger.info('✅ Audit log cleanup initialized');
  } catch (error) {
    logger.warn('⚠️ Some real-time systems could not be initialized:', error.message);
  }
}

// MongoDB connection and server startup
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGO_URI;

// Optimize MongoDB connection
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);
mongoose.set('debug', false); // Disable query logging

connectDB()
  .then(async () => {
    // Create database indexes for performance
    await createIndexes();

    // Create dashboard-specific indexes
    const { createDashboardIndexes } = await import('./utils/dashboardIndexes');
    await createDashboardIndexes();

    // Create analytics indexes
    const { createAnalyticsIndexes } = await import('./utils/createAnalyticsIndexes');
    await createAnalyticsIndexes();

    // Warm up connection pool
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database connection warmed up');

    // Initialize onboarding system
    try {
      const { initializeOnboardingSystem } = await import('./utils/initializeOnboarding');
      await initializeOnboardingSystem();
      logger.info('✅ Onboarding system initialized');
    } catch (error) {
      logger.warn('⚠️ Onboarding system could not be initialized:', error.message);
    }

    // Seed default chart of accounts
    try {
      const { seedDefaultAccounts } = await import('./utils/seedDefaultAccounts');
      await seedDefaultAccounts();
      logger.info('✅ Default chart of accounts seeded');
    } catch (error) {
      logger.warn('⚠️ Default accounts could not be seeded:', error.message);
    }

    // Seed default currencies
    try {
      const { seedDefaultCurrencies } = await import('./utils/seedDefaultCurrencies');
      await seedDefaultCurrencies();
      logger.info('✅ Default currencies seeded');
    } catch (error) {
      logger.warn('⚠️ Default currencies could not be seeded:', error.message);
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
    });

    // Initialize real-time systems after server starts
    await initializeRealTimeSystems();

  })
  .catch((error) => {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close().then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close().then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Enhanced error handling
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});
