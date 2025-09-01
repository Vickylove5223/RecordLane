import { ErrorHandler } from './errorHandler';

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export class RetryService {
  private defaultOptions: RetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000,
    shouldRetry: (error: any) => {
      // Default retry conditions
      if (error?.name === 'NetworkError' || error?.name === 'TypeError') {
        return true;
      }
      if (error?.status >= 500 && error?.status < 600) {
        return true;
      }
      if (error?.status === 429) { // Rate limit
        return true;
      }
      return false;
    },
  };

  async execute<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;
    let delay = config.retryDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 0) {
          ErrorHandler.logError('RETRY_SUCCESS', `Operation succeeded after ${attempt} retries`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (!config.shouldRetry || !config.shouldRetry(error, attempt + 1)) {
          ErrorHandler.logError('RETRY_SKIPPED', 'Error not retryable', { error, attempt });
          throw error;
        }

        // Log retry attempt
        ErrorHandler.logError('RETRY_ATTEMPT', `Retrying operation (attempt ${attempt + 1}/${config.maxRetries})`, {
          error: error?.message || String(error),
          delay,
        });

        // Call retry callback if provided
        if (config.onRetry) {
          try {
            config.onRetry(error, attempt + 1);
          } catch (callbackError) {
            console.warn('Error in retry callback:', callbackError);
          }
        }

        // Wait before retrying
        await this.delay(delay);

        // Calculate next delay with backoff
        if (config.backoffMultiplier) {
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay || Infinity);
        }
      }
    }

    // All retries exhausted
    ErrorHandler.logError('RETRY_EXHAUSTED', `Operation failed after ${config.maxRetries} retries`, {
      lastError: lastError?.message || String(lastError),
    });
    
    throw lastError;
  }

  // Execute with exponential backoff
  async executeWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      retryDelay: baseDelay,
      backoffMultiplier: 2,
      maxDelay: 30000, // 30 seconds max
    });
  }

  // Execute with linear backoff
  async executeWithLinearBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayIncrement: number = 1000
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      retryDelay: delayIncrement,
      backoffMultiplier: 1,
      maxDelay: delayIncrement * maxRetries,
      shouldRetry: (error, attempt) => {
        // Custom delay calculation for linear backoff
        return this.defaultOptions.shouldRetry!(error, attempt);
      },
    });
  }

  // Execute with immediate retry (no delay)
  async executeImmediate<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      retryDelay: 0,
      backoffMultiplier: 1,
    });
  }

  // Execute with custom retry condition
  async executeWithCondition<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: any, attempt: number) => boolean,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      retryDelay: delay,
      shouldRetry,
    });
  }

  // Helper method to create a delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Create a retryable version of a function
  createRetryable<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: Partial<RetryOptions>
  ): T {
    return ((...args: Parameters<T>) => {
      return this.execute(() => fn(...args), options);
    }) as T;
  }

  // Batch retry multiple operations
  async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    options?: Partial<RetryOptions>
  ): Promise<T[]> {
    const results = await Promise.allSettled(
      operations.map(op => this.execute(op, options))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      ErrorHandler.logError('BATCH_RETRY_PARTIAL_FAILURE', `${failed.length}/${operations.length} operations failed`, {
        failures: failed.map(f => (f as PromiseRejectedResult).reason),
      });
    }

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        throw result.reason;
      }
    });
  }

  // Check if an error is retryable
  isRetryableError(error: any): boolean {
    return this.defaultOptions.shouldRetry!(error, 1);
  }

  // Get retry statistics
  static getRetryStats(): {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
  } {
    // This would typically be tracked in a more sophisticated way
    // For now, return dummy data
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
    };
  }
}

// Global retry service instance
export const globalRetryService = new RetryService();
