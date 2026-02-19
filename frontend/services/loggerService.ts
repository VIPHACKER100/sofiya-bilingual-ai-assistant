type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private isDev = process.env.NODE_ENV === 'development';
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  private log(level: LogLevel, message: string, data?: any, source?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
      source
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.listeners.forEach(cb => cb(entry));

    if (this.isDev || level === 'error') {
      const prefix = `[${level.toUpperCase()}]${source ? ` [${source}]` : ''}`;
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '');
          break;
        case 'info':
          console.info(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'error':
          console.error(prefix, message, data || '');
          break;
      }
    }
  }

  subscribe(callback: (entry: LogEntry) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  debug(message: string, data?: any, source?: string) {
    this.log('debug', message, data, source);
  }

  info(message: string, data?: any, source?: string) {
    this.log('info', message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.log('warn', message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.log('error', message, data, source);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(l => l.level === level);
    }
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

export const logger = new Logger();

export const debug = (message: string, data?: any) => logger.debug(message, data, 'APP');
export const info = (message: string, data?: any) => logger.info(message, data, 'APP');
export const warn = (message: string, data?: any) => logger.warn(message, data, 'APP');
export const error = (message: string, data?: any) => logger.error(message, data, 'APP');
