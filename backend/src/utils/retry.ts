/**
 * Retry configuration for database operations
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration for optimistic locking
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
};

/**
 * Retry wrapper for operations that may fail due to optimistic locking
 * @param operation - Async operation to retry
 * @param config - Retry configuration
 * @param operationName - Name of operation for logging
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.delayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a concurrency error (optimistic locking failure)
      const isConcurrencyError =
        error.message?.includes('Concurrent') ||
        error.message?.includes('version') ||
        error.code === 'P2034' || // Prisma concurrent update error
        error.code === 'P2025'; // Record not found (might be deleted by concurrent operation)

      // If it's not a concurrency error, don't retry
      if (!isConcurrencyError) {
        throw error;
      }

      // If we've exhausted all attempts, throw the last error
      if (attempt === config.maxAttempts) {
        console.error(
          `${operationName} failed after ${config.maxAttempts} attempts:`,
          error.message
        );
        throw new Error(
          `${operationName} failed due to high concurrency. Please try again.`
        );
      }

      // Log retry attempt
      console.warn(
        `${operationName} attempt ${attempt} failed (concurrency), retrying in ${delay}ms...`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay *= config.backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`${operationName} failed unexpectedly`);
}

/**
 * Check if an error is a stock validation error
 */
export function isStockError(error: any): boolean {
  return (
    error.message?.includes('Insufficient stock') ||
    error.message?.includes('Stock validation failed') ||
    error.statusCode === 400
  );
}

/**
 * Check if an error is a concurrency error
 */
export function isConcurrencyError(error: any): boolean {
  return (
    error.message?.includes('Concurrent') ||
    error.message?.includes('version') ||
    error.code === 'P2034' ||
    error.code === 'P2025'
  );
}
