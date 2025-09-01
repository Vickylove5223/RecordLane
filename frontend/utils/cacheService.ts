import { CACHE_CONFIG } from '../config';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expirationTime: number;
  version: string;
}

export class CacheService {
  private namespace: string;
  private storageKey: string;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.storageKey = `${CACHE_CONFIG.storageKey}-${namespace}`;
    
    // Schedule periodic cleanup
    this.scheduleCleanup();
  }

  // Set cache entry
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const now = Date.now();
      const expirationTime = now + (ttl || CACHE_CONFIG.maxAge);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expirationTime,
        version: CACHE_CONFIG.version,
      };

      const cacheData = this.getStorageData();
      cacheData[key] = entry;
      
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to set cache entry:', error);
      // Fallback: clear cache if storage is full
      if (error.name === 'QuotaExceededError') {
        await this.clear();
      }
    }
  }

  // Get cache entry
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const cacheData = this.getStorageData();
      const entry = cacheData[key] as CacheEntry<T>;
      
      if (!entry) {
        return null;
      }

      // Check version compatibility
      if (entry.version !== CACHE_CONFIG.version) {
        await this.delete(key);
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expirationTime) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn('Failed to get cache entry:', error);
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
      console.warn('Failed to delete cache entry:', error);
    }
  }

  // Clear all cache entries for this namespace
  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get cache statistics
  getStats(): {
    entries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    try {
      const cacheData = this.getStorageData();
      const entries = Object.values(cacheData);
      
      if (entries.length === 0) {
        return { entries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
      }

      const timestamps = entries.map(entry => entry.timestamp);
      const totalSize = JSON.stringify(cacheData).length;

      return {
        entries: entries.length,
        totalSize,
        oldestEntry: Math.min(...timestamps),
        newestEntry: Math.max(...timestamps),
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { entries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
    }
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
      console.warn('Failed to cleanup cache:', error);
    }
  }

  // Schedule periodic cleanup
  private scheduleCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.cleanupInterval);
  }

  // Get storage data with error handling
  private getStorageData(): Record<string, CacheEntry> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to parse cache data, clearing cache:', error);
      localStorage.removeItem(this.storageKey);
      return {};
    }
  }
}

// Global cache management
export class GlobalCacheManager {
  private static instances: Map<string, CacheService> = new Map();

  static getInstance(namespace: string): CacheService {
    if (!this.instances.has(namespace)) {
      this.instances.set(namespace, new CacheService(namespace));
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
      
      this.instances.clear();
    } catch (error) {
      console.warn('Failed to clear all caches:', error);
    }
  }

  static getGlobalStats(): {
    totalCaches: number;
    totalSize: number;
    totalEntries: number;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.storageKey));
      
      let totalSize = 0;
      let totalEntries = 0;

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

      return {
        totalCaches: cacheKeys.length,
        totalSize,
        totalEntries,
      };
    } catch (error) {
      console.warn('Failed to get global cache stats:', error);
      return { totalCaches: 0, totalSize: 0, totalEntries: 0 };
    }
  }
}
