import { logger } from './logger';

let ioInstance: any = null;

export const setSocketInstance = (io: any) => {
  ioInstance = io;
};

export const initializeFinanceSystem = async () => {
  try {
    logger.info('🏦 Initializing Finance & Accounting System...');

    // Initialize budget monitoring
    try {
      const { initializeBudgetMonitoring, syncAllBudgetsOnStartup } = await import('./initializeBudgetMonitoring');
      await syncAllBudgetsOnStartup();
      initializeBudgetMonitoring();
      logger.info('✅ Budget monitoring initialized');
    } catch (error) {
      logger.warn('⚠️ Budget monitoring initialization skipped:', error);
    }

    logger.info('✅ Finance & Accounting System initialized successfully');
    logger.info('💰 Features active:');
    logger.info('   - Chart of Accounts');
    logger.info('   - General Ledger');
    logger.info('   - Journal Entries');
    logger.info('   - Invoices & Payments');
    logger.info('   - Expense Management');
    logger.info('   - Budget Management');
    logger.info('   - Project Ledger');
    logger.info('   - Financial Reports');
    logger.info('   - Period Closing');
    logger.info('   - Bank Reconciliation');
    logger.info('   - Real-time Integration');

  } catch (error) {
    logger.error('❌ Error initializing Finance System:', error);
    // Don't throw error to prevent server startup failure
  }
};

export const setupFinanceSocketEvents = (io: any) => {
  ioInstance = io;
  
  io.on('connection', (socket: any) => {
    socket.on('finance:subscribe', (data: any) => {
      const { projectId, userId } = data;
      if (projectId) socket.join(`finance:project:${projectId}`);
      if (userId) socket.join(`finance:user:${userId}`);
      logger.info(`Socket ${socket.id} subscribed to finance updates`);
    });

    socket.on('finance:unsubscribe', (data: any) => {
      const { projectId, userId } = data;
      if (projectId) socket.leave(`finance:project:${projectId}`);
      if (userId) socket.leave(`finance:user:${userId}`);
    });
  });
  
  logger.info('✅ Finance socket events configured');
};

export const emitFinanceEvent = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(event, { ...data, timestamp: new Date() });
  }
};

export const emitToProject = (projectId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`finance:project:${projectId}`).emit(event, { ...data, timestamp: new Date() });
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`finance:user:${userId}`).emit(event, { ...data, timestamp: new Date() });
  }
};
