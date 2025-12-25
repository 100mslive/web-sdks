/**
 * Consolidated utilities index file
 * Exports all utility functions for easy access
 */

// Array manipulation utilities
export * from './array-utils';

// Object manipulation utilities
export * from './object-utils';

// Validation utilities (export all except isPresent to avoid conflict)
export {
  isValidNumber,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidString,
  isEmpty,
  isEmptyString,
  isNullOrUndefined,
  hasValidProperty,
  isValidArray,
  isArray,
  isPlainObject,
  isFunction,
  isBoolean,
  isInstanceOf,
  isValidDeviceId,
  isValidTrackId,
  isValidPeerId,
  isInRange,
  isValidPercentage,
  createValidator,
  validateObjectSchema,
} from './validation-utils';

// Async utilities
export * from './async-utils';

// Error handling utilities (avoid re-exporting withErrorHandling to prevent conflicts)
export type { ErrorContext, ErrorHandlingOptions } from './error-handling';
export {
  logError,
  buildErrorMessage,
  wrapErrorWithContext,
  handleError,
  createCatchHandler,
  formatErrorForAnalytics,
  handlePluginMigrationError,
  handleDeviceError,
  handleConnectionError,
} from './error-handling';

// Existing utilities (re-exports for backward compatibility)
export { default as HMSLogger } from './logger';
export * from './validations';
export * from './date';
export * from './math';
export * from './promise';
export * from './timer-utils';
export * from './track';
export * from './media';
export * from './support';
export * from './user-agent';
export * from './network-info';
export * from './jwt';
export * from './json';
export * from './fetch';
export * from './constants';
export * from './autoplay';
export * from './device-error';
export * from './ice-server-config';
export * from './id-factory';
export * from './intersection-observer';
export * from './local-storage';
export * from './local-storage-polyfill';
export * from './queue';
export * from './resize-observer';
export * from './session-description';
export * from './track-audio-level-monitor';
export * from './typed-event-emitter';
export * from './whiteboard';
export * from './cpu-pressure-monitor';
export * from './analytics-deviceId';
