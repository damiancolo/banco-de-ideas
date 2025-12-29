/**
 * Logging utility for Banco de Ideas
 * Provides structured logging with environment-aware output
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isDevelopment = process.env.NODE_ENV !== 'production';

    private log(level: LogLevel, message: string, data?: unknown) {
        const prefix = this.getPrefix(level);

        if (level === 'error') {
            // Always log errors
            console.error(`${prefix} ${message}`, data || '');
        } else if (this.isDevelopment) {
            // Only log non-errors in development
            console.log(`${prefix} ${message}`, data || '');
        }
    }

    private getPrefix(level: LogLevel): string {
        const prefixes = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            debug: '🔍'
        };
        return prefixes[level];
    }

    info(message: string, data?: unknown) {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown) {
        this.log('warn', message, data);
    }

    error(message: string, error?: unknown) {
        this.log('error', message, error);
    }

    debug(message: string, data?: unknown) {
        this.log('debug', message, data);
    }
}

export const logger = new Logger();
