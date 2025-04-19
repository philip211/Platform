import { LoggerService } from '@nestjs/common';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Custom logger implementation for the application
 * Supports different log levels based on environment configuration
 */
export class AppLogger implements LoggerService {
  private context?: string;
  private static logLevel: LogLevel = AppLogger.getLogLevelFromEnv();

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Determine log level from environment variable
   */
  private static getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    
    switch (envLevel) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context || this.context || 'Application';
    
    return `[${timestamp}] [${contextStr}] ${message}`;
  }

  /**
   * Log error message
   */
  error(message: any, trace?: string, context?: string): void {
    if (AppLogger.logLevel >= LogLevel.ERROR) {
      console.error(this.formatMessage(`❌ ERROR: ${message}`, context));
      if (trace) {
        console.error(trace);
      }
    }
  }

  /**
   * Log warning message
   */
  warn(message: any, context?: string): void {
    if (AppLogger.logLevel >= LogLevel.WARN) {
      console.warn(this.formatMessage(`⚠️ WARN: ${message}`, context));
    }
  }

  /**
   * Log info message
   */
  log(message: any, context?: string): void {
    if (AppLogger.logLevel >= LogLevel.INFO) {
      console.log(this.formatMessage(`ℹ️ INFO: ${message}`, context));
    }
  }

  /**
   * Log debug message
   */
  debug(message: any, context?: string): void {
    if (AppLogger.logLevel >= LogLevel.DEBUG) {
      console.log(this.formatMessage(`🔍 DEBUG: ${message}`, context));
    }
  }

  /**
   * Log verbose message (alias for debug)
   */
  verbose(message: any, context?: string): void {
    this.debug(message, context);
  }
}
