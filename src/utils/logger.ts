/**
 * Logger utility for VOLT app
 * Provides consistent logging with level filtering and formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = __DEV__ ? 'debug' : 'info';
  private readonly APP_NAME = 'VOLT';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(message: string): string {
    return `[${this.APP_NAME}] ${message}`;
  }

  private safeStringify(obj: any): string {
    try {
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      if (obj === null || obj === undefined) return String(obj);
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return '[Object - could not stringify]';
    }
  }

  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      const safeArgs = args.map(arg => this.safeStringify(arg));
      console.debug(this.formatMessage(message), ...safeArgs);
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const safeArgs = args.map(arg => this.safeStringify(arg));
      console.info(this.formatMessage(message), ...safeArgs);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      const safeArgs = args.map(arg => this.safeStringify(arg));
      console.warn(this.formatMessage(message), ...safeArgs);
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const safeArgs = args.map(arg => this.safeStringify(arg));
      console.error(this.formatMessage(message), ...safeArgs);
    }
  }

  public logPerformance(label: string, startTime: number): void {
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);
  }
}

export const logger = Logger.getInstance();