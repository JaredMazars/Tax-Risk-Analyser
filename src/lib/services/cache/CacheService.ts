/**
 * Distributed cache service with Redis support and in-memory fallback
 * Automatically uses Redis if available, falls back to in-memory cache otherwise
 */

import { getRedisClient, isRedisAvailable } from '@/lib/cache/redisClient';
import { logger } from '@/lib/utils/logger';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  // In-memory fallback cache (when Redis not available)
  private memoryCache = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached value (tries Redis first, falls back to memory)
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    
    // Try Redis first
    if (redis && isRedisAvailable()) {
      try {
        const value = await redis.get(key);
        if (value) {
          logger.debug('Redis cache hit', { key });
          return JSON.parse(value) as T;
        }
        logger.debug('Redis cache miss', { key });
        return null;
      } catch (error) {
        logger.error('Redis get error, falling back to memory', { key, error });
      }
    }
    
    // Fallback to memory cache
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    
    logger.debug('Memory cache hit', { key });
    return entry.data as T;
  }

  /**
   * Set cached value with TTL in seconds
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    const redis = getRedisClient();
    
    // Try Redis first
    if (redis && isRedisAvailable()) {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
        logger.debug('Redis cache set', { key, ttl: ttlSeconds });
        return;
      } catch (error) {
        logger.error('Redis set error, falling back to memory', { key, error });
      }
    }
    
    // Fallback to memory cache
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.memoryCache.set(key, { data, expiry });
    logger.debug('Memory cache set', { key });
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    const redis = getRedisClient();
    
    if (redis && isRedisAvailable()) {
      try {
        await redis.del(key);
        logger.debug('Redis cache deleted', { key });
        return true;
      } catch (error) {
        logger.error('Redis delete error', { key, error });
      }
    }
    
    return this.memoryCache.delete(key);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<number> {
    const redis = getRedisClient();
    let count = 0;
    
    if (redis && isRedisAvailable()) {
      try {
        const keys = await redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          count = await redis.del(...keys);
        }
        logger.info('Redis invalidated keys', { pattern, count });
        return count;
      } catch (error) {
        logger.error('Redis invalidate error', { pattern, error });
      }
    }
    
    // Fallback to memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const redis = getRedisClient();
    
    if (redis && isRedisAvailable()) {
      try {
        await redis.flushdb();
        logger.info('Redis cache cleared');
        return;
      } catch (error) {
        logger.error('Redis clear error', error);
      }
    }
    
    this.memoryCache.clear();
  }

  /**
   * Get cache size (memory cache only)
   */
  size(): number {
    return this.memoryCache.size;
  }

  /**
   * Clean up expired entries in memory cache
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiry) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    
    return count;
  }
}

// Singleton instance
export const cache = new CacheService();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

























