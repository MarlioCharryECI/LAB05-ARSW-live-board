// utils/retry.js
export class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async executeWithRetry(operation, context = 'operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${context}:`, error.message);
        
        if (attempt === this.maxRetries) {
          console.error(`All ${this.maxRetries} attempts failed for ${context}`);
          throw lastError;
        }
        
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retryManager = new RetryManager();
