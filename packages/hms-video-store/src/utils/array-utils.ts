/**
 * Array manipulation utilities to reduce code duplication
 */

/**
 * Filters array items by a property value
 * @param array - Array to filter
 * @param property - Property to check
 * @param value - Value to match
 * @returns Filtered array
 */
export function filterByProperty<T, K extends keyof T>(array: T[], property: K, value: T[K]): T[] {
  return array.filter(item => item[property] === value);
}

/**
 * Finds first item in array by property value
 * @param array - Array to search
 * @param property - Property to check
 * @param value - Value to match
 * @returns First matching item or undefined
 */
export function findByProperty<T, K extends keyof T>(array: T[], property: K, value: T[K]): T | undefined {
  return array.find(item => item[property] === value);
}

/**
 * Filters array items by multiple property values
 * @param array - Array to filter
 * @param criteria - Object with property-value pairs to match
 * @returns Filtered array
 */
export function filterByMultipleProperties<T>(array: T[], criteria: Partial<T>): T[] {
  return array.filter(item => {
    return Object.entries(criteria).every(([key, value]) => {
      return item[key as keyof T] === value;
    });
  });
}

/**
 * Filters array to exclude items with specified property values
 * @param array - Array to filter
 * @param property - Property to check
 * @param value - Value to exclude
 * @returns Filtered array
 */
export function excludeByProperty<T, K extends keyof T>(array: T[], property: K, value: T[K]): T[] {
  return array.filter(item => item[property] !== value);
}

/**
 * Groups array items by a property value
 * @param array - Array to group
 * @param property - Property to group by
 * @returns Object with property values as keys and arrays as values
 */
export function groupByProperty<T, K extends keyof T>(array: T[], property: K): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  array.forEach(item => {
    const key = String(item[property]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  return groups;
}

/**
 * Finds items in array by instance type
 * @param array - Array to filter
 * @param instanceType - Constructor function to check against
 * @returns Array of items matching the instance type
 */
export function filterByInstanceType<T, U extends T>(array: T[], instanceType: new (...args: any[]) => U): U[] {
  return array.filter((item): item is U => item instanceof instanceType);
}

/**
 * Removes duplicates from array based on property value
 * @param array - Array to deduplicate
 * @param property - Property to use for comparison
 * @returns Array with duplicates removed
 */
export function uniqueByProperty<T, K extends keyof T>(array: T[], property: K): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[property];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Calculates average of numeric array values
 * @param array - Array of numbers
 * @param predicate - Optional function to extract numeric value from objects
 * @returns Average value or 0 if array is empty
 */
export function calculateAverage<T>(array: T[], predicate?: (item: T) => number | undefined): number {
  if (array.length === 0) {
    return 0;
  }

  const extractValue = predicate || ((item: T) => item as unknown as number);
  const validValues = array
    .map(extractValue)
    .filter((value): value is number => typeof value === 'number' && !isNaN(value));

  if (validValues.length === 0) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

/**
 * Partitions array into two arrays based on a predicate
 * @param array - Array to partition
 * @param predicate - Function to determine which partition an item belongs to
 * @returns Tuple with [truthy items, falsy items]
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];

  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });

  return [truthy, falsy];
}
