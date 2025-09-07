import { CACHE_CONFIG } from '../config';
import { ErrorHandler } from './errorHandler';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expirationTime: number;
  version: string;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheStats {
  entries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  memoryUsage: number;
}

export class CacheService {
  private namespace: string;
  private storageKey: string;
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;
  private compressionEnabled = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(namespace: string, maxSize = CACHE_CONFIG.maxAge) {
    this.namespace = namespace;
    this.storageKey = `${CACHE_CONFIG.storageKey}-${namespace}`;
    this.maxSize = maxSize;
    
    // Enable compression for large data
    this.compressionEnabled = typeof CompressionStream !== 'undefined';
    
    this.scheduleCleanup();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Load existing stats
    const stats = this.getStats();
  }

  // Set cache entry with optimizations
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const now = Date.now();
      const expirationTime = now + (ttl || CACHE_CONFIG.maxAge);
      
      // Calculate data size
      const serializedData = JSON.stringify(data);
      const dataSize = new Blob([serializedData]).size;
      
      // Check if data is too large
      if (dataSize > this.maxSize * 0.1) { // 10% of max cache size
        console.warn(`Cache entry for ${key} is large (${dataSize} bytes), consider reducing data size`);
      }

      let processedData = data;
      
      // Apply compression for large entries
      if (this.compressionEnabled && dataSize > 10000) { // 10KB threshold
        try {
          processedData = await this.compressData(data) as T;
        } catch (compressionError) {
          console.warn('Compression failed, storing uncompressed:', compressionError);
        }
      }
      
      const entry: CacheEntry<T> = {
        data: processedData,
        timestamp: now,
        expirationTime,
        version: CACHE_CONFIG.version,
        accessCount: 0,
        lastAccessed: now,
        size: dataSize,
      };

      const cacheData = this.getStorageData();
      cacheData[key] = entry;
      
      // Check cache size and evict if necessary
      await this.evictIfNecessary(cacheData);
      
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      ErrorHandler.logError('cache-set-error', error, { namespace: this.namespace, key });
      
      // Fallback: clear cache if storage is full
      if (error.name === 'QuotaExceededError') {
        await this.handleQuotaExceeded();
      }
    }
  }

  // Get cache entry with optimizations
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const cacheData = this.getStorageData();
      const entry = cacheData[key] as CacheEntry<T>;
      
      if (!entry) {
        this.missCount++;
        return null;
      }

      // Check version compatibility
      if (entry.version !== CACHE_CONFIG.version) {
        await this.delete(key);
        this.missCount++;
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expirationTime) {
        await this.delete(key);
        this.missCount++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      // Decompress if needed
      if (this.compressionEnabled && this.isCompressed(entry.data)) {
        try {
          entry.data = await this.decompressData(entry.data);
        } catch (decompressionError) {
          console.warn('Decompression failed:', decompressionError);
          await this.delete(key);
          this.missCount++;
          return null;
        }
      }

      // Update entry in storage
      cacheData[key] = entry;
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));

      this.hitCount++;
      return entry;
    } catch (error) {
      ErrorHandler.logError('cache-get-error', error, { namespace: this.namespace, key });
      this.missCount++;
      return null;
    }
  }

  // Delete cache entry
  async delete(key: string): Promise<void> {
    try {
      const cacheData = this.getStorageData();
      delete cacheData[key];
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      ErrorHandler.logError('cache-delete-error', error, { namespace: this.namespace, key });
    }
  }

  // Clear all cache entries for this namespace
  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
      this.hitCount = 0;
      this.missCount = 0;
    } catch (error) {
      ErrorHandler.logError('cache-clear-error', error, { namespace: this.namespace });
    }
  }

  // Get cache statistics with enhanced metrics
  getStats(): CacheStats {
    try {
      const cacheData = this.getStorageData();
      const entries = Object.values(cacheData);
      
      if (entries.length === 0) {
        return { 
          entries: 0, 
          totalSize: 0, 
          hitRate: 0, 
          oldestEntry: null, 
          newestEntry: null, 
          memoryUsage: 0 
        };
      }

      const timestamps = entries.map(entry => entry.timestamp);
      const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
      const hitRate = this.hitCount + this.missCount > 0 
        ? (this.hitCount / (this.hitCount + this.missCount)) * 100 
        : 0;

      const memoryUsage = JSON.stringify(cacheData).length;

      return {
        entries: entries.length,
        totalSize,
        hitRate,
        oldestEntry: Math.min(...timestamps),
        newestEntry: Math.max(...timestamps),
        memoryUsage,
      };
    } catch (error) {
      ErrorHandler.logError('cache-stats-error', error, { namespace: this.namespace });
      return { 
        entries: 0, 
        totalSize: 0, 
        hitRate: 0, 
        oldestEntry: null, 
        newestEntry: null, 
        memoryUsage: 0 
      };
    }
  }

  // Advanced cache operations
  async getMultiple<T>(keys: string[]): Promise<Map<string, CacheEntry<T>>> {
    const results = new Map<string, CacheEntry<T>>();
    
    await Promise.all(
      keys.map(async (key) => {
        const entry = await this.get<T>(key);
        if (entry) {
          results.set(key, entry);
        }
      })
    );
    
    return results;
  }

  async setMultiple<T>(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, data, ttl }) => this.set(key, data, ttl))
    );
  }

  // Cleanup expired entries
  private async cleanup(): Promise<void> {
    try {
      const cacheData = this.getStorageData();
      const now = Date.now();
      let hasChanges = false;

      for (const [key, entry] of Object.entries(cacheData)) {
        if (now > entry.expirationTime || entry.version !== CACHE_CONFIG.version) {
          delete cacheData[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
      }
    } catch (error) {
      ErrorHandler.logError('cache-cleanup-error', error, { namespace: this.namespace });
    }
  }

  // Smart eviction based on LRU and size
  private async evictIfNecessary(cacheData: Record<string, CacheEntry>): Promise<void> {
    const stats = this.calculateCacheSize(cacheData);
    
    if (stats.totalSize > this.maxSize) {
      // Sort by last accessed time (LRU) and size
      const entries = Object.entries(cacheData)
        .map(([key, entry]) => ({ key, entry }))
        .sort((a, b) => {
          // Prioritize larger, less frequently used entries
          const scoreA = a.entry.size / (a.entry.accessCount + 1) * (Date.now() - a.entry.lastAccessed);
          const scoreB = b.entry.size / (b.entry.accessCount + 1) * (Date.now() - b.entry.lastAccessed);
          return scoreB - scoreA;
        });

      // Remove entries until we're under the size limit
      let currentSize = stats.totalSize;
      for (const { key } of entries) {
        if (currentSize <= this.maxSize * 0.8) break; // Target 80% of max size
        
        currentSize -= cacheData[key].size || 0;
        delete cacheData[key];
      }
    }
  }

  private calculateCacheSize(cacheData: Record<string, CacheEntry>): { totalSize: number; entries: number } {
    let totalSize = 0;
    let entries = 0;
    
    for (const entry of Object.values(cacheData)) {
      totalSize += entry.size || 0;
      entries++;
    }
    
    return { totalSize, entries };
  }

  // Handle quota exceeded error
  private async handleQuotaExceeded(): Promise<void> {
    try {
      const cacheData = this.getStorageData();
      const entries = Object.entries(cacheData);
      
      // Remove 50% of entries, prioritizing oldest and largest
      const toRemove = Math.floor(entries.length * 0.5);
      const sorted = entries
        .sort((a, b) => {
          const scoreA = a[1].size / (a[1].accessCount + 1);
          const scoreB = b[1].size / (b[1].accessCount + 1);
          return scoreB - scoreA;
        })
        .slice(0, toRemove);

      for (const [key] of sorted) {
        delete cacheData[key];
      }

      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
      
      ErrorHandler.logError('cache-quota-exceeded-handled', null, {
        namespace: this.namespace,
        removedEntries: toRemove,
        remainingEntries: entries.length - toRemove,
      });
    } catch (error) {
      // If we can't recover, clear the entire cache
      await this.clear();
      ErrorHandler.logError('cache-quota-exceeded-cleared', error, { namespace: this.namespace });
    }
  }

  // Compression utilities
  private async compressData<T>(data: T): Promise<any> {
    if (!this.compressionEnabled) return data;
    
    try {
      const jsonString = JSON.stringify(data);
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(jsonString));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      return {
        __compressed: true,
        data: Array.from(compressed),
      };
    } catch (error) {
      return data; // Fallback to uncompressed
    }
  }

  private async decompressData(compressedData: any): Promise<any> {
    if (!this.isCompressed(compressedData)) return compressedData;
    
    try {
      const compressed = new Uint8Array(compressedData.data);
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(compressed);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      const jsonString = new TextDecoder().decode(decompressed);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Decompression failed');
    }
  }

  private isCompressed(data: any): boolean {
    return data && typeof data === 'object' && data.__compressed === true;
  }

  // Schedule periodic cleanup
  private scheduleCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.cleanupInterval);
  }

  // Get storage data with error handling
  private getStorageData(): Record<string, CacheEntry> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      ErrorHandler.logError('cache-storage-parse-error', error, { namespace: this.namespace });
      localStorage.removeItem(this.storageKey);
      return {};
    }
  }

  // Cleanup resources
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

// Global cache management with enhanced features
export class GlobalCacheManager {
  private static instances: Map<string, CacheService> = new Map();

  static getInstance(namespace: string, maxSize?: number): CacheService {
    if (!this.instances.has(namespace)) {
      this.instances.set(namespace, new CacheService(namespace, maxSize));
    }
    return this.instances.get(namespace)!;
  }

  static async clearAll(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.storageKey));
      
      for (const key of cacheKeys) {
        localStorage.removeItem(key);
      }
      
      // Dispose all instances
      for (const instance of this.instances.values()) {
        instance.dispose();
      }
      
      this.instances.clear();
    } catch (error) {
      ErrorHandler.logError('global-cache-clear-error', error);
    }
  }

  static getGlobalStats(): {
    totalCaches: number;
    totalSize: number;
    totalEntries: number;
    averageHitRate: number;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.storageKey));
      
      let totalSize = 0;
      let totalEntries = 0;
      let totalHitRate = 0;
      let validCaches = 0;

      for (const key of cacheKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          try {
            const parsed = JSON.parse(data);
            totalEntries += Object.keys(parsed).length;
          } catch (error) {
            // Skip invalid cache data
          }
        }
      }

      // Calculate average hit rate from active instances
      for (const instance of this.instances.values()) {
        const stats = instance.getStats();
        totalHitRate += stats.hitRate;
        validCaches++;
      }

      return {
        totalCaches: cacheKeys.length,
        totalSize,
        totalEntries,
        averageHitRate: validCaches > 0 ? totalHitRate / validCaches : 0,
      };
    } catch (error) {
      ErrorHandler.logError('global-cache-stats-error', error);
      return { totalCaches: 0, totalSize: 0, totalEntries: 0, averageHitRate: 0 };
    }
  }

  static async optimizeAll(): Promise<void> {
    for (const instance of this.instances.values()) {
      try {
        // Trigger cleanup for each instance
        await (instance as any).cleanup();
      } catch (error) {
        ErrorHandler.logError('cache-optimization-error', error);
      }
    }
  }

  static disposeAll(): void {
    for (const instance of this.instances.values()) {
      instance.dispose();
    }
    this.instances.clear();
  }
}
