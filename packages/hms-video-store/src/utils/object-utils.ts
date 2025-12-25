/**
 * Object manipulation utilities to reduce code duplication
 */

/**
 * Deep merge two objects, with the second object taking precedence
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  Object.keys(source).forEach(key => {
    const typedKey = key as keyof T;
    const targetValue = result[typedKey];
    const sourceValue = source[typedKey];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      (result as any)[key] = deepMerge(targetValue as any, sourceValue as any);
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  });

  return result;
}

/**
 * Shallow merge objects with type safety
 * @param target - Target object
 * @param source - Source object with updates
 * @returns Merged object
 */
export function shallowMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  return { ...target, ...source };
}

/**
 * Check if value is a plain object (not array, null, or function)
 */
function isPlainObject(value: any): value is Record<string, any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value !== 'function' &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (isPlainObject(obj)) {
    const cloned: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned as T;
  }

  return obj;
}

/**
 * Pick specific properties from an object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns Object with only specified keys
 */
export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific properties from an object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns Object without specified keys
 */
export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;
  keys.forEach(key => {
    delete (result as any)[key];
  });
  return result;
}

/**
 * Check if object has all specified properties
 * @param obj - Object to check
 * @param properties - Array of property names to check
 * @returns True if all properties exist
 */
export function hasAllProperties<T extends Record<string, any>>(obj: T, properties: (keyof T)[]): boolean {
  return properties.every(prop => Object.prototype.hasOwnProperty.call(obj, prop));
}

/**
 * Check if object has any of the specified properties
 * @param obj - Object to check
 * @param properties - Array of property names to check
 * @returns True if any property exists
 */
export function hasAnyProperty<T extends Record<string, any>>(obj: T, properties: (keyof T)[]): boolean {
  return properties.some(prop => Object.prototype.hasOwnProperty.call(obj, prop));
}

/**
 * Get nested property value safely
 * @param obj - Source object
 * @param path - Property path as string (e.g., 'user.profile.name')
 * @param defaultValue - Default value if path doesn't exist
 * @returns Property value or default
 */
export function getNestedProperty<T>(obj: Record<string, any>, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current as T;
}

/**
 * Set nested property value safely
 * @param obj - Target object
 * @param path - Property path as string
 * @param value - Value to set
 */
export function setNestedProperty(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!(key in current) || !isPlainObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

/**
 * Remove properties with undefined or null values
 * @param obj - Object to clean
 * @param removeNull - Whether to remove null values (default: false)
 * @returns Cleaned object
 */
export function removeUndefinedProperties<T extends Record<string, any>>(obj: T, removeNull = false): Partial<T> {
  const result: Partial<T> = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key as keyof T];
    if (value !== undefined && (!removeNull || value !== null)) {
      result[key as keyof T] = value;
    }
  });

  return result;
}

/**
 * Transform object values while preserving keys
 * @param obj - Source object
 * @param transformer - Function to transform each value
 * @returns Object with transformed values
 */
export function mapObjectValues<T, U>(
  obj: Record<string, T>,
  transformer: (value: T, key: string) => U,
): Record<string, U> {
  const result: Record<string, U> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[key] = transformer(value, key);
  });

  return result;
}

/**
 * Filter object entries based on a predicate
 * @param obj - Source object
 * @param predicate - Function to test each key-value pair
 * @returns Filtered object
 */
export function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean,
): Record<string, T> {
  const result: Record<string, T> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (predicate(value, key)) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Check if two objects are deeply equal
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal
 */
export function isDeepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 === null || obj2 === null) {
    return false;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 !== 'object') {
    return false;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key => {
    return Object.prototype.hasOwnProperty.call(obj2, key) && isDeepEqual(obj1[key], obj2[key]);
  });
}
