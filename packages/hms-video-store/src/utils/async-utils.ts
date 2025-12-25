/**
 * Async utilities to standardize promise handling and reduce code duplication
 */

import { ErrorContext, ErrorHandlingOptions, handleError } from './error-handling';

/**
 * Creates a delay promise
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps a promise with a timeout
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Error message for timeout
 * @returns Promise that rejects if timeout is exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out',
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retries a promise-returning function with exponential backoff
 * @param fn - Function that returns a promise
 * @param maxRetries - Maximum number of retries
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @returns Promise that resolves with the result or rejects with the last error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
  maxDelayMs = 10000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      await delay(delayMs);
    }
  }

  throw lastError!; // eslint-disable-line no-throw-literal
}

/**
 * Executes promises in sequence (one after another)
 * @param promises - Array of functions that return promises
 * @returns Array of results in the same order
 */
export async function sequentialPromises<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];

  for (const promiseFn of promises) {
    results.push(await promiseFn());
  }

  return results;
}

/**
 * Executes promises in batches with concurrency limit
 * @param promises - Array of functions that return promises
 * @param batchSize - Number of promises to execute concurrently
 * @returns Array of results in the same order
 */
export async function batchedPromises<T>(promises: (() => Promise<T>)[], batchSize = 3): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Wraps an async operation with standardized error handling
 * @param operation - The async operation to wrap
 * @param context - Error context information
 * @param options - Error handling options
 * @returns Promise that handles errors according to options
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options: ErrorHandlingOptions = {},
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const handledError = handleError(error, context, options);
    if (options.shouldThrow) {
      throw handledError;
    }
    return null;
  }
}

/**
 * Creates a debounced async function
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(fn: T, delayMs: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: any) => void) | null = null;
  let latestReject: ((reason: any) => void) | null = null;

  return ((...args: Parameters<T>) => {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        // Reject the previous promise
        if (latestReject) {
          latestReject(new Error('Debounced call cancelled'));
        }
      }

      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          if (latestResolve) {
            latestResolve(result);
          }
        } catch (error) {
          if (latestReject) {
            latestReject(error);
          }
        } finally {
          timeoutId = null;
          latestResolve = null;
          latestReject = null;
        }
      }, delayMs);
    });
  }) as T;
}

/**
 * Creates a throttled async function
 * @param fn - Function to throttle
 * @param delayMs - Throttle delay in milliseconds
 * @returns Throttled function
 */
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(fn: T, delayMs: number): T {
  let lastCallTime = 0;
  let pendingCall: Promise<Awaited<ReturnType<T>>> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallTime >= delayMs) {
      lastCallTime = now;
      pendingCall = fn(...args);
      return pendingCall;
    }

    // Return the pending call if one exists
    if (pendingCall) {
      return pendingCall;
    }

    // Create a new pending call
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      const remainingDelay = delayMs - (now - lastCallTime);
      setTimeout(async () => {
        try {
          lastCallTime = Date.now();
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          pendingCall = null;
        }
      }, remainingDelay);
    });
  }) as T;
}

/**
 * Safely executes an async operation that might fail
 * @param operation - Async operation to execute
 * @param fallbackValue - Value to return if operation fails
 * @param onError - Optional error handler
 * @returns Promise that always resolves (never rejects)
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  onError?: (error: unknown) => void,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return fallbackValue;
  }
}

/**
 * Executes multiple promises and returns results with success/failure status
 * @param promises - Array of promise functions to execute
 * @returns Array of results with status information
 */
export async function allSettledResults<T>(
  promises: (() => Promise<T>)[],
): Promise<Array<{ success: boolean; value?: T; error?: unknown }>> {
  const settledResults = await Promise.allSettled(promises.map(fn => fn()));

  return settledResults.map(result => {
    if (result.status === 'fulfilled') {
      return { success: true, value: result.value };
    } else {
      return { success: false, error: result.reason };
    }
  });
}

/**
 * Creates a cancellable promise
 * @param operation - Async operation to wrap
 * @returns Object with promise and cancel function
 */
export function cancellablePromise<T>(operation: (signal: AbortSignal) => Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  const controller = new AbortController();

  const promise = operation(controller.signal);

  const cancel = () => {
    controller.abort();
  };

  return { promise, cancel };
}
