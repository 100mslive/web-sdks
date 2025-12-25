/**
 * Validation utilities to reduce code duplication across the codebase
 */

/**
 * Check if value is present (not null or undefined)
 * Use in places where 0, false need to be considered valid.
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

/**
 * Check if value is null
 */
export function isNull(value: any): value is null {
  return value === null;
}

/**
 * Check if value is undefined
 */
export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

/**
 * Check if value is null or undefined
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is a valid number (not NaN or undefined)
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: any): value is number {
  return isValidNumber(value) && value > 0;
}

/**
 * Check if value is a non-negative number (including 0)
 */
export function isNonNegativeNumber(value: any): value is number {
  return isValidNumber(value) && value >= 0;
}

/**
 * Check if value is a valid string (not empty after trim)
 */
export function isValidString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is an empty string or whitespace only
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Check if object has a property with a valid value
 */
export function hasValidProperty<T extends object, K extends keyof T>(
  obj: T,
  property: K,
  validator?: (value: T[K]) => boolean,
): boolean {
  if (!Object.prototype.hasOwnProperty.call(obj, property)) {
    return false;
  }

  const value = obj[property];
  if (isNullOrUndefined(value)) {
    return false;
  }

  return validator ? validator(value) : true;
}

/**
 * Check if value is a valid array with elements
 */
export function isValidArray<T>(value: any): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if value is an array (including empty arrays)
 */
export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if value is a plain object (not null, array, or function)
 */
export function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function';
}

/**
 * Check if value is a function
 */
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if error is an instance of a specific error type
 */
export function isInstanceOf<T>(value: unknown, constructor: new (...args: any[]) => T): value is T {
  return value instanceof constructor;
}

/**
 * Validates if a device ID is valid format
 */
export function isValidDeviceId(deviceId: any): deviceId is string {
  return isValidString(deviceId) && deviceId !== 'default';
}

/**
 * Validates if a track ID is valid format
 */
export function isValidTrackId(trackId: any): trackId is string {
  return isValidString(trackId);
}

/**
 * Validates if a peer ID is valid format
 */
export function isValidPeerId(peerId: any): peerId is string {
  return isValidString(peerId);
}

/**
 * Validates if value is within a numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isValidNumber(value) && value >= min && value <= max;
}

/**
 * Validates if value is a valid percentage (0-100)
 */
export function isValidPercentage(value: any): value is number {
  return isValidNumber(value) && isInRange(value, 0, 100);
}

/**
 * Creates a validation function that checks multiple conditions
 */
export function createValidator<T>(...validators: Array<(value: T) => boolean>): (value: T) => boolean {
  return (value: T) => validators.every(validator => validator(value));
}

/**
 * Validates object against a schema of validators
 */
export function validateObjectSchema<T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, (value: any) => boolean>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(obj[key])) {
      errors.push(`Invalid value for property '${key}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
