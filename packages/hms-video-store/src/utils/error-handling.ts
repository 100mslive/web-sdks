import HMSLogger from './logger';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../error/HMSException';
import { HMSTrackException } from '../error/HMSTrackException';

/**
 * Common error handling utilities to reduce duplication across the codebase
 */

/**
 * Interface for error context information
 */
export interface ErrorContext {
  tag?: string;
  action?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for error handling options
 */
export interface ErrorHandlingOptions {
  shouldLog?: boolean;
  shouldThrow?: boolean;
  shouldReturnError?: boolean;
  logLevel?: 'error' | 'warn' | 'debug';
}

/**
 * Default error handling options
 */
const DEFAULT_OPTIONS: ErrorHandlingOptions = {
  shouldLog: true,
  shouldThrow: false,
  shouldReturnError: false,
  logLevel: 'error',
};

/**
 * Logs an error with context information
 * @param tag - Component tag for logging
 * @param message - Error message or description
 * @param error - The error object
 * @param context - Additional context information
 * @param logLevel - Log level (error, warn, debug)
 */
export function logError(
  tag: string,
  message: string,
  error?: Error | HMSException | unknown,
  context?: Record<string, any>,
  logLevel: 'error' | 'warn' | 'debug' = 'error',
): void {
  const contextStr = context ? `, context: ${JSON.stringify(context)}` : '';
  const fullMessage = `${message}${contextStr}`;

  switch (logLevel) {
    case 'error':
      HMSLogger.e(tag, fullMessage, error);
      break;
    case 'warn':
      HMSLogger.w(tag, fullMessage, error);
      break;
    case 'debug':
      HMSLogger.d(tag, fullMessage, error);
      break;
  }
}

/**
 * Creates a standardized error message with context
 * @param operation - The operation that failed
 * @param context - Additional context information
 * @param originalMessage - Original error message
 */
export function buildErrorMessage(operation: string, context?: Record<string, any>, originalMessage?: string): string {
  let message = `Failed to ${operation}`;

  if (context) {
    const contextEntries = Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    message += ` (${contextEntries})`;
  }

  if (originalMessage) {
    message += `: ${originalMessage}`;
  }

  return message;
}

/**
 * Wraps a native error with HMS exception and adds context
 * @param nativeError - The original error
 * @param hmsException - The HMS exception to wrap with
 * @param context - Additional context information
 */
export function wrapErrorWithContext(
  nativeError: Error,
  hmsException: HMSException | HMSTrackException,
  context?: ErrorContext,
): HMSException | HMSTrackException {
  hmsException.addNativeError(nativeError);

  if (context?.metadata) {
    // Add context to description
    const contextStr = Object.entries(context.metadata)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    hmsException.description += ` [Context: ${contextStr}]`;
  }

  return hmsException;
}

/**
 * Handles errors in a standardized way with logging, wrapping, and optional throwing
 * @param error - The error to handle
 * @param context - Error context information
 * @param options - Error handling options
 */
export function handleError(
  error: Error | HMSException | unknown,
  context: ErrorContext,
  options: ErrorHandlingOptions = {},
): HMSException | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { tag = '[ErrorHandler]', action = '', operation = 'unknown operation' } = context;

  let hmsError: HMSException;

  // Convert to HMS exception if needed
  if (error instanceof HMSException) {
    hmsError = error;
  } else if (error instanceof Error) {
    hmsError = ErrorFactory.GenericErrors.Unknown(
      action ? (action as unknown as HMSAction) : HMSAction.NONE,
      error.message,
    );
    hmsError.addNativeError(error);
  } else {
    hmsError = ErrorFactory.GenericErrors.Unknown(
      action ? (action as unknown as HMSAction) : HMSAction.NONE,
      String(error),
    );
  }

  // Add context to error if provided
  if (context.metadata) {
    hmsError = wrapErrorWithContext(
      error instanceof Error ? error : new Error(String(error)),
      hmsError,
      context,
    ) as HMSException;
  }

  // Log the error if requested
  if (opts.shouldLog) {
    logError(tag, `Error in ${operation}`, hmsError, context.metadata, opts.logLevel);
  }

  // Throw if requested
  if (opts.shouldThrow) {
    throw hmsError;
  }

  // Return error if requested
  return opts.shouldReturnError ? hmsError : null;
}

/**
 * Creates a promise catch handler with standardized error handling
 * @param context - Error context information
 * @param options - Error handling options
 */
export function createCatchHandler(
  context: ErrorContext,
  options: ErrorHandlingOptions = {},
): (error: Error | unknown) => void {
  return (error: Error | unknown) => {
    handleError(error, context, { shouldLog: true, ...options });
  };
}

/**
 * Wraps an async operation with standardized error handling
 * @param operation - The async operation to wrap
 * @param context - Error context information
 * @param options - Error handling options
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options: ErrorHandlingOptions = {},
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, options);
    return null;
  }
}

/**
 * Formats error information for analytics or logging
 * @param error - The error to format
 * @param context - Additional context
 */
export function formatErrorForAnalytics(error: Error | HMSException, context?: ErrorContext): Record<string, any> {
  const formatted: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof HMSException) {
    formatted.code = error.code;
    formatted.action = error.action;
    formatted.isTerminal = error.isTerminal;
    formatted.description = error.description;
  }

  if (context?.metadata) {
    formatted.context = context.metadata;
  }

  return formatted;
}

/**
 * Plugin-specific error handling for migration operations
 * @param tag - Component tag
 * @param plugin - The plugin object
 * @param error - The error that occurred
 */
export function handlePluginMigrationError(tag: string, plugin: any, error: Error): void {
  const pluginName = plugin?.constructor?.name === 'Object' ? 'unknown' : plugin?.constructor?.name || 'unknown';
  logError(tag, 'Plugin add failed while migrating', error, { plugin: pluginName });
}

/**
 * Device-specific error handling
 * @param tag - Component tag
 * @param deviceType - Type of device (audio/video)
 * @param operation - The operation that failed
 * @param error - The error that occurred
 */
export function handleDeviceError(tag: string, deviceType: string, operation: string, error: Error): void {
  logError(tag, `${deviceType} device ${operation} failed`, error, { deviceType, operation });
}

/**
 * Network/connection error handling
 * @param tag - Component tag
 * @param operation - The network operation
 * @param error - The error that occurred
 * @param connectionInfo - Additional connection context
 */
export function handleConnectionError(
  tag: string,
  operation: string,
  error: Error,
  connectionInfo?: Record<string, any>,
): void {
  logError(tag, `Connection ${operation} failed`, error, { operation, ...connectionInfo });
}
