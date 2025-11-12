import { BudgetLedgerIntegration } from './budgetLedgerIntegration';
import { logger } from './logger';

export const initializeBudgetMonitoring = () => {
  try {
    // Start real-time budget monitoring
    BudgetLedgerIntegration.startBudgetMonitoring();
    
    logger.info('Budget monitoring system initialized successfully');
    
    // Log monitoring status every hour
    setInterval(() => {
      logger.info('Budget monitoring system is running - checking for alerts and variances');
    }, 3600000); // 1 hour
    
  } catch (error) {
    logger.error('Failed to initialize budget monitoring:', error);
  }
};

export const syncAllBudgetsOnStartup = async () => {
  try {
    logger.info('Starting initial budget synchronization...');
    
    const results = await BudgetLedgerIntegration.syncAllProjectBudgets();
    
    const successful = results.filter(r => r.synced).length;
    const failed = results.filter(r => !r.synced).length;
    
    logger.info(`Initial budget sync completed: ${successful} successful, ${failed} failed`);
    
    return results;
  } catch (error) {
    logger.error('Failed to sync budgets on startup:', error);
    throw error;
  }
};