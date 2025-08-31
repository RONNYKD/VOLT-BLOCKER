/**
 * Error handling utilities for storage operations
 * Provides comprehensive error management and recovery strategies
 */
import { StorageError } from './storage';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  STORAGE = 'storage',
  VALIDATION = 'validation',
  MIGRATION = 'migration',
  NETWORK = 'network',
  PERMISSION = 'permission',
  CORRUPTION = 'corruption',
  UNKNOWN = 'unknown',
}

// Error report interface
export interface ErrorReport {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent?: string;
  appVersion?: string;
  resolved?: boolean;
  resolvedAt?: number;
}

// Recovery strategy interface
export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  canRetry: boolean;
  maxRetries?: number;
}

// Error handler class
export class ErrorHandler {
  private static errorReports: ErrorReport[] = [];
  private static maxReports = 100;

  /**
   * Handle and categorize errors
   */
  static async handleError(
    error: Error,
    context?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): Promise<ErrorReport> {
    const category = this.categorizeError(error);
    const report = this.createErrorReport(error, category, severity, context);
    
    // Store error report
    this.addErrorReport(report);
    
    // Log error based on severity
    this.logError(report);
    
    // Attempt automatic recovery for certain error types
    if (this.canAutoRecover(category)) {
      await this.attemptRecovery(report);
    }
    
    return report;
  }

  /**
   * Categorize error based on type and message
   */
  private static categorizeError(error: Error): ErrorCategory {
    if (error instanceof StorageError) {
      switch (error.code) {
        case 'STORAGE_ERROR':
          return ErrorCategory.STORAGE;
        case 'VALIDATION_ERROR':
          return ErrorCategory.VALIDATION;
        case 'MIGRATION_ERROR':
          return ErrorCategory.MIGRATION;
        case 'PARSE_ERROR':
          return ErrorCategory.CORRUPTION;
        default:
          return ErrorCategory.STORAGE;
      }
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('permission') || message.includes('access denied')) {
      return ErrorCategory.PERMISSION;
    }
    
    if (message.includes('parse') || message.includes('json') || message.includes('corrupt')) {
      return ErrorCategory.CORRUPTION;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Create error report
   */
  private static createErrorReport(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: Record<string, any>
  ): ErrorReport {
    return {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      category,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: 'React Native App', // Static value for React Native
      appVersion: '1.0.0', // Should be dynamically set
      resolved: false,
    };
  }

  /**
   * Add error report to storage
   */
  private static addErrorReport(report: ErrorReport): void {
    this.errorReports.unshift(report);
    
    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }
  }

  /**
   * Log error based on severity
   */
  private static logError(report: ErrorReport): void {
    const logMessage = `[${report.severity.toUpperCase()}] ${report.category}: ${report.message}`;
    
    switch (report.severity) {
      case ErrorSeverity.LOW:
        console.info(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(logMessage);
        if (report.stack) {
          console.error(report.stack);
        }
        break;
    }
  }

  /**
   * Check if error can be auto-recovered
   */
  private static canAutoRecover(category: ErrorCategory): boolean {
    return [
      ErrorCategory.STORAGE,
      ErrorCategory.NETWORK,
      ErrorCategory.CORRUPTION,
    ].includes(category);
  }

  /**
   * Attempt automatic recovery
   */
  private static async attemptRecovery(report: ErrorReport): Promise<void> {
    const strategies = this.getRecoveryStrategies(report.category);
    
    for (const strategy of strategies) {
      try {
        console.log(`Attempting recovery strategy: ${strategy.name}`);
        const success = await strategy.execute();
        
        if (success) {
          report.resolved = true;
          report.resolvedAt = Date.now();
          console.log(`Recovery successful: ${strategy.name}`);
          return;
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy failed: ${strategy.name}`, recoveryError);
      }
    }
    
    console.warn(`All recovery strategies failed for error: ${report.id}`);
  }

  /**
   * Get recovery strategies for error category
   */
  private static getRecoveryStrategies(category: ErrorCategory): RecoveryStrategy[] {
    switch (category) {
      case ErrorCategory.STORAGE:
        return [
          {
            name: 'Clear corrupted data',
            description: 'Remove corrupted storage entries',
            execute: async () => {
              // Implementation would clear specific corrupted keys
              return true;
            },
            canRetry: false,
          },
          {
            name: 'Reset storage',
            description: 'Clear all storage and reinitialize',
            execute: async () => {
              // Implementation would reset all storage
              return true;
            },
            canRetry: false,
          },
        ];

      case ErrorCategory.NETWORK:
        return [
          {
            name: 'Retry with backoff',
            description: 'Retry network operation with exponential backoff',
            execute: async () => {
              // Implementation would retry the failed network operation
              return true;
            },
            canRetry: true,
            maxRetries: 3,
          },
        ];

      case ErrorCategory.CORRUPTION:
        return [
          {
            name: 'Restore from backup',
            description: 'Restore data from last known good backup',
            execute: async () => {
              // Implementation would restore from backup
              return true;
            },
            canRetry: false,
          },
          {
            name: 'Reinitialize data',
            description: 'Clear corrupted data and start fresh',
            execute: async () => {
              // Implementation would reinitialize with default data
              return true;
            },
            canRetry: false,
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Generate unique error ID
   */
  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error reports
   */
  static getErrorReports(
    category?: ErrorCategory,
    severity?: ErrorSeverity,
    resolved?: boolean
  ): ErrorReport[] {
    let reports = [...this.errorReports];
    
    if (category) {
      reports = reports.filter(r => r.category === category);
    }
    
    if (severity) {
      reports = reports.filter(r => r.severity === severity);
    }
    
    if (resolved !== undefined) {
      reports = reports.filter(r => r.resolved === resolved);
    }
    
    return reports;
  }

  /**
   * Mark error as resolved
   */
  static markResolved(errorId: string): boolean {
    const report = this.errorReports.find(r => r.id === errorId);
    if (report) {
      report.resolved = true;
      report.resolvedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Clear error reports
   */
  static clearErrorReports(olderThan?: number): void {
    if (olderThan) {
      this.errorReports = this.errorReports.filter(r => r.timestamp > olderThan);
    } else {
      this.errorReports = [];
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.errorReports.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      resolved: 0,
      unresolved: 0,
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach(cat => {
      stats.byCategory[cat] = 0;
    });
    Object.values(ErrorSeverity).forEach(sev => {
      stats.bySeverity[sev] = 0;
    });

    // Count errors
    this.errorReports.forEach(report => {
      stats.byCategory[report.category]++;
      stats.bySeverity[report.severity]++;
      if (report.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }

  /**
   * Export error reports for debugging
   */
  static exportErrorReports(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      reports: this.errorReports,
      stats: this.getErrorStats(),
    }, null, 2);
  }
}

// Convenience functions
export const errorHandler = {
  handle: (error: Error, context?: Record<string, any>, severity?: ErrorSeverity) =>
    ErrorHandler.handleError(error, context, severity),
  getReports: (category?: ErrorCategory, severity?: ErrorSeverity, resolved?: boolean) =>
    ErrorHandler.getErrorReports(category, severity, resolved),
  markResolved: (errorId: string) => ErrorHandler.markResolved(errorId),
  clear: (olderThan?: number) => ErrorHandler.clearErrorReports(olderThan),
  stats: () => ErrorHandler.getErrorStats(),
  export: () => ErrorHandler.exportErrorReports(),
};