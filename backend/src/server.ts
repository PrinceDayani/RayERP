import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";
import routes from "./routes/index";
import assignmentRoutes from "./routes/assignment.routes";
import backupRoutes from "./routes/backupRoutes";
import errorMiddleware from "./middleware/error.middleware";

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

const app = express();
const server = http.createServer(app);

// Trust proxy for secure cookies and proxies
app.set("trust proxy", 1);

// CORS configuration
const allowedOrigins = [
  ...process.env.CORS_ORIGIN!.split(','),
  ...process.env.FRONTEND_URL!.split(',')
].filter(Boolean);

const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
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
    uptime: process.uptime()
  });
});

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

// Socket.IO setup
const io = new SocketServer(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  path: "/socket.io/",
  pingTimeout: 20000,
  pingInterval: 10000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6
});

// Handle socket connections
io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  // Handle user authentication and room joining
  socket.on("authenticate", (token) => {
    try {
      if (!token || typeof token !== 'string') {
        socket.emit("auth_error", "Invalid token format");
        return;
      }
      
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      
      if (!decoded || !decoded.id) {
        socket.emit("auth_error", "Invalid token payload");
        return;
      }
      
      socket.join(`user-${decoded.id}`);
      logger.info(`User ${decoded.id} authenticated and joined room`);
      socket.emit("auth_success", { userId: decoded.id });
    } catch (error) {
      logger.error("Socket authentication failed:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id
      });
      socket.emit("auth_error", "Authentication failed");
    }
  });

  // Settings events
  socket.on("settings:updated", (data) => {
    socket.broadcast.emit("settings:synced", {
      ...data,
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on("settings:force_sync", (data) => {
    socket.emit("settings:synced", {
      ...data,
      forced: true,
      timestamp: new Date()
    });
  });

  socket.on("settings:tab_changed", (data) => {
    // Analytics event - could be stored for user behavior analysis
    logger.info(`User ${socket.id} changed to tab: ${data.tab}`);
  });

  // Notification events
  socket.on("notification:test", (data) => {
    socket.emit("notification:test", {
      id: `test-${Date.now()}`,
      type: 'info',
      title: data.title || 'Test Notification',
      message: data.message || 'This is a test notification to verify your settings.',
      priority: 'low',
      timestamp: new Date()
    });
  });

  // Real-time data events
  socket.on("subscribe:notifications", () => {
    socket.join("notifications");
    logger.info(`Socket ${socket.id} subscribed to notifications`);
  });

  socket.on("unsubscribe:notifications", () => {
    socket.leave("notifications");
    logger.info(`Socket ${socket.id} unsubscribed from notifications`);
  });

  socket.on("ping", (data, callback) => {
    if (typeof callback === "function") {
      callback("pong");
    } else {
      socket.emit("pong", "pong");
    }
  });

  // Chat events
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    logger.info(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    logger.info(`Socket ${socket.id} left chat ${chatId}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user_typing", {
      userId: data.userId,
      chatId: data.chatId
    });
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.chatId).emit("user_stop_typing", {
      userId: data.userId,
      chatId: data.chatId
    });
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Export for use in other files
export { io };
export default app;

// Initialize real-time admin emitter
import { realTimeAdminEmitter } from './utils/realTimeAdminEmitter';
realTimeAdminEmitter.initialize(io);

// Initialize real-time data emitter
import { RealTimeEmitter } from './utils/realTimeEmitter';
RealTimeEmitter.initialize(io);
RealTimeEmitter.startIntervals();

// Initialize cron jobs
import { initializeCronJobs } from './utils/cronJobs';
initializeCronJobs();

// Initialize recurring job schedulers
import { initializeSchedulers } from './utils/recurringJobsScheduler';
initializeSchedulers();

// MongoDB connection and server startup
const PORT = Number(process.env.PORT!);
const MONGODB_URI = process.env.MONGO_URI!;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    logger.info("✅ Connected to MongoDB");
    
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
        logger.warn('⚠️ Complete Finance System initialization skipped:', error);
      }
    } catch (error) {
      logger.error('❌ Error initializing Finance System:', error);
    }
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      if (allowedOrigins.length > 0) {
        logger.info(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
      }
    });
  })
  .catch((error) => {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Promise Rejection:", err);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});
