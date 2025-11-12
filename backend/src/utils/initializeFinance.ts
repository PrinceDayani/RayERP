import { logger } from './logger';
import { io } from '../server';

export const initializeFinanceSystem = async () => {
  try {
    logger.info('🏦 Initializing Finance & Accounting System...');

    // Initialize budget monitoring
    const { initializeBudgetMonitoring, syncAllBudgetsOnStartup } = await import('./initializeBudgetMonitoring');
    await syncAllBudgetsOnStartup();
    initializeBudgetMonitoring();
    logger.info('✅ Budget monitoring initialized');

    // Setup finance socket events
    if (io) {
      io.on('connection', (socket) => {
        socket.on('finance:subscribe', (data) => {
          const { projectId, userId } = data;
          if (projectId) socket.join(`finance:project:${projectId}`);
          if (userId) socket.join(`finance:user:${userId}`);
          logger.info(`Socket ${socket.id} subscribed to finance updates`);
        });

        socket.on('finance:unsubscribe', (data) => {
          const { projectId, userId } = data;
          if (projectId) socket.leave(`finance:project:${projectId}`);
          if (userId) socket.leave(`finance:user:${userId}`);
        });
      });
      logger.info('✅ Finance socket events configured');
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
    throw error;
  }
};

export const emitFinanceEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, { ...data, timestamp: new Date() });
  }
};

export const emitToProject = (projectId: string, event: string, data: any) => {
  if (io) {
    io.to(`finance:project:${projectId}`).emit(event, { ...data, timestamp: new Date() });
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`finance:user:${userId}`).emit(event, { ...data, timestamp: new Date() });
  }
};
