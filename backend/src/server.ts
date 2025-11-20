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
import { Server as SocketServer, Socket } from "socket.io";
import "express-async-errors";

// Extend Socket interface to include userId
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Compression middleware
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

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

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

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
app.use("/api/fast", require('./routes/quickfix.routes'));

// API Routes
app.use("/api", routes);
app.use("/api", assignmentRoutes);
app.use("/api/backup", backupRoutes);

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

// Socket.IO setup with enhanced error handling
const io = new SocketServer(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  path: "/socket.io/",
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e7,
  connectTimeout: 45000
});

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      // Allow connection without token, authentication can happen later
      return next();
    }
    
    if (typeof token !== 'string' || token === 'undefined' || token === 'null') {
      return next(new Error('Invalid token format'));
    }
    
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return next(new Error('Invalid token payload'));
    }
    
    (socket as AuthenticatedSocket).userId = decoded.id;
    next();
  } catch (error) {
    logger.error("Socket authentication failed:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    next(new Error('jwt malformed'));
  }
});

// Enhanced socket connection handling with real-time updates
io.on("connection", (socket: AuthenticatedSocket) => {
  logger.info(`User connected: ${socket.id}`);
  
  // Send real-time connection status
  socket.emit("connection_status", {
    connected: true,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  // If user was pre-authenticated during handshake, join their room
  if (socket.userId) {
    socket.join(`user-${socket.userId}`);
    logger.info(`Pre-authenticated user ${socket.userId} joined room`);
    socket.emit("auth_success", { 
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
    startRealTimeUpdates(socket, socket.userId);
  }
  
  // Handle user authentication and room joining (for post-connection auth)
  socket.on("authenticate", async (token) => {
    try {
      if (!token || typeof token !== 'string') {
        socket.emit("auth_error", "Invalid token format");
        return;
      }
      
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        socket.emit("auth_error", "Invalid token payload");
        return;
      }
      
      socket.join(`user-${decoded.id}`);
      socket.userId = decoded.id;
      
      logger.info(`User ${decoded.id} authenticated and joined room`);
      socket.emit("auth_success", { 
        userId: decoded.id,
        timestamp: new Date().toISOString()
      });
      
      // Start real-time data updates for authenticated user
      startRealTimeUpdates(socket, decoded.id);
      
    } catch (error) {
      logger.error("Socket authentication failed:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id
      });
      socket.emit("auth_error", "Authentication failed");
    }
  });

  // Real-time data subscription
  socket.on("subscribe_realtime", (data) => {
    const { types = [] } = data || {};
    
    types.forEach(type => {
      socket.join(`realtime_${type}`);
    });
    
    socket.emit("realtime_subscribed", {
      types,
      timestamp: new Date().toISOString()
    });
  });

  // Settings events with real-time sync
  socket.on("settings:updated", (data) => {
    socket.broadcast.emit("settings:synced", {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("settings:force_sync", (data) => {
    socket.emit("settings:synced", {
      ...data,
      forced: true,
      timestamp: new Date().toISOString()
    });
  });

  // Real-time notifications
  socket.on("notification:test", (data) => {
    socket.emit("notification:received", {
      id: `test-${Date.now()}`,
      type: 'info',
      title: data?.title || 'Test Notification',
      message: data?.message || 'This is a test notification to verify your settings.',
      priority: 'low',
      timestamp: new Date().toISOString()
    });
  });

  // Chat events with real-time updates
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    socket.to(chatId).emit("user_joined_chat", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString()
    });
    logger.info(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    socket.to(chatId).emit("user_left_chat", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString()
    });
    logger.info(`Socket ${socket.id} left chat ${chatId}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user_typing", {
      userId: data.userId,
      chatId: data.chatId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.chatId).emit("user_stop_typing", {
      userId: data.userId,
      chatId: data.chatId,
      timestamp: new Date().toISOString()
    });
  });

  // Enhanced ping/pong with latency measurement
  socket.on("ping", (data, callback) => {
    const timestamp = new Date().toISOString();
    if (typeof callback === "function") {
      callback({ pong: true, timestamp, serverTime: Date.now() });
    } else {
      socket.emit("pong", { pong: true, timestamp, serverTime: Date.now() });
    }
  });

  socket.on("disconnect", (reason) => {
    logger.info(`User disconnected: ${socket.id}, reason: ${reason}`);
    
    // Notify other users in the same rooms
    if (socket.userId) {
      socket.broadcast.emit("user_disconnected", {
        userId: socket.userId,
        socketId: socket.id,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Error handling for socket events
  socket.on("error", (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
    socket.emit("socket_error", {
      message: "An error occurred",
      timestamp: new Date().toISOString()
    });
  });
});

// Real-time data updates function
function startRealTimeUpdates(socket: AuthenticatedSocket, userId: string) {
  const updateInterval = setInterval(() => {
    // Send real-time system stats
    socket.emit("system_stats", {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: io.engine.clientsCount
    });
  }, 30000); // Every 30 seconds

  socket.on("disconnect", () => {
    clearInterval(updateInterval);
  });
}

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

    logger.info('✅ Real-time systems initialized');
  } catch (error) {
    logger.warn('⚠️ Some real-time systems could not be initialized:', error.message);
  }
}

// MongoDB connection and server startup
const PORT = Number(process.env.PORT);
const MONGODB_URI = process.env.MONGO_URI;

// Optimize MongoDB connection
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);

connectDB()
  .then(async () => {
    // Create database indexes for performance
    await createIndexes();
    
    // Warm up connection pool
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database connection warmed up');
    
    // Initialize onboarding system
    try {
      const { initializeOnboardingSystem } = await import('./utils/initializeOnboarding');
      await initializeOnboardingSystem();
      
      // Create default roles if they don't exist
      const { Role } = await import('./models/Role');
      
      const defaultRoles = [
        {
          name: 'super_admin',
          description: 'Super Administrator with complete system access',
          permissions: [
            'manage_roles', 'view_users', 'create_user', 'update_user', 'delete_user',
            'view_employees', 'create_employee', 'update_employee', 'delete_employee',
            'view_products', 'create_product', 'update_product', 'delete_product',
            'view_customers', 'create_customer',
            'update_customer', 'delete_customer', 'view_reports', 'export_data',
            'system_settings', 'view_logs'
          ]
        },
        {
          name: 'admin',
          description: 'Administrator with management access',
          permissions: [
            'view_users', 'create_user', 'update_user',
            'view_employees', 'create_employee', 'update_employee',
            'view_products', 'create_product', 'update_product',
            'view_customers',
            'create_customer', 'update_customer', 'view_reports'
          ]
        },
        {
          name: 'manager',
          description: 'Manager with operational access',
          permissions: [
            'view_users', 'view_employees',
            'view_products', 'create_product', 'update_product',
            'view_customers', 'create_customer', 'update_customer'
          ]
        },
        {
          name: 'employee',
          description: 'Employee with basic access',
          permissions: [
            'view_employees', 'view_products', 'view_customers'
          ]
        }
      ];
      
      for (const roleData of defaultRoles) {
        const existingRole = await Role.findOne({ name: roleData.name });
        if (!existingRole) {
          await Role.create(roleData);
          logger.info(`✅ Default ${roleData.name} role created`);
        }
      }
      
      logger.info('✅ Onboarding system initialized');
    } catch (error) {
      logger.error('❌ Error initializing onboarding system:', error);
    }
    
    // Initialize Finance & Accounting System
    try {
      const { initializeFinanceSystem, setupFinanceSocketEvents } = await import('./utils/initializeFinance');
      await initializeFinanceSystem();
      setupFinanceSocketEvents(io);
      
      // Initialize Complete Finance System
      try {
        const { initializeCompleteFinanceSystem } = await import('./utils/initializeFinanceComplete');
        await initializeCompleteFinanceSystem();
      } catch (error) {
        logger.warn('⚠️ Complete Finance System initialization skipped:', error.message);
      }
    } catch (error) {
      logger.error('❌ Error initializing Finance System:', error);
    }
    
    // Initialize real-time systems
    await initializeRealTimeSystems();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Socket.IO server initialized`);
      if (allowedOrigins.length > 0) {
        logger.info(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
      }
    });
  })
  .catch((error) => {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
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

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close().then(() => {
      logger.info('Process terminated');
      process.exit(0);
    }).catch((err) => {
      logger.error('Error closing MongoDB connection:', err);
      process.exit(1);
    });
  });
});
