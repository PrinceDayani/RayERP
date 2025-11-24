// Audit logging utility for tracking user actions

export interface AuditLog {
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 1000;

  log(entry: Omit<AuditLog, 'timestamp' | 'ipAddress' | 'userAgent'>) {
    const auditEntry: AuditLog = {
      ...entry,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    };

    // Add to in-memory logs
    this.logs.push(auditEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', auditEntry);
    }

    // Store in localStorage for persistence
    this.persistLog(auditEntry);

    // TODO: Send to backend API for permanent storage
    // this.sendToBackend(auditEntry);

    return auditEntry;
  }

  private persistLog(entry: AuditLog) {
    try {
      const stored = localStorage.getItem('audit-logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push(entry);
      
      // Keep only last 100 logs in localStorage
      const recentLogs = logs.slice(-100);
      localStorage.setItem('audit-logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  }

  private getClientIP(): string {
    // In production, this should come from the backend
    return 'client-ip';
  }

  getLogs(): AuditLog[] {
    return [...this.logs];
  }

  getStoredLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem('audit-logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('audit-logs');
  }

  // Helper methods for common actions
  logBudgetCreated(userId: string, userName: string, budgetId: string, details: any) {
    return this.log({
      userId,
      userName,
      action: 'CREATE',
      resource: 'BUDGET',
      resourceId: budgetId,
      details,
    });
  }

  logBudgetUpdated(userId: string, userName: string, budgetId: string, details: any) {
    return this.log({
      userId,
      userName,
      action: 'UPDATE',
      resource: 'BUDGET',
      resourceId: budgetId,
      details,
    });
  }

  logBudgetDeleted(userId: string, userName: string, budgetId: string) {
    return this.log({
      userId,
      userName,
      action: 'DELETE',
      resource: 'BUDGET',
      resourceId: budgetId,
    });
  }

  logBudgetSubmitted(userId: string, userName: string, budgetId: string) {
    return this.log({
      userId,
      userName,
      action: 'SUBMIT',
      resource: 'BUDGET',
      resourceId: budgetId,
    });
  }

  logBudgetApproved(userId: string, userName: string, budgetId: string, comments?: string) {
    return this.log({
      userId,
      userName,
      action: 'APPROVE',
      resource: 'BUDGET',
      resourceId: budgetId,
      details: { comments },
    });
  }

  logBudgetRejected(userId: string, userName: string, budgetId: string, comments?: string) {
    return this.log({
      userId,
      userName,
      action: 'REJECT',
      resource: 'BUDGET',
      resourceId: budgetId,
      details: { comments },
    });
  }

  logBudgetViewed(userId: string, userName: string, budgetId: string) {
    return this.log({
      userId,
      userName,
      action: 'VIEW',
      resource: 'BUDGET',
      resourceId: budgetId,
    });
  }

  logBudgetExported(userId: string, userName: string, format: string, count: number) {
    return this.log({
      userId,
      userName,
      action: 'EXPORT',
      resource: 'BUDGET',
      resourceId: 'bulk',
      details: { format, count },
    });
  }
}

// Singleton instance
const auditLogger = new AuditLogger();

export default auditLogger;
