import Redis from 'ioredis';
import { logger } from '@/lib/utils/logger';

let redis: Redis | null = null;
let isConnected = false;

/**
 * Get Redis client instance
 * Returns null if Redis is not configured (will use in-memory fallback)
 */
export function getRedisClient(): Redis | null {
  // If no connection string, return null (will use in-memory fallback)
  if (!process.env.REDIS_CONNECTION_STRING) {
    return null;
  }

  if (!redis) {
    try {
      const connString = process.env.REDIS_CONNECTION_STRING;
      
      // Parse connection string
      // Azure format: host:port,password=xxx,ssl=True
      // Local format: localhost:6379,password=xxx
      const isAzure = connString.includes('.redis.cache.windows.net');
      
      if (isAzure) {
        // Azure Redis format
        const parts = connString.split(',');
        const [host, port] = (parts[0] || '').split(':');
        const passwordPart = parts.find(p => p.includes('password='));
        const password = passwordPart ? passwordPart.split('=')[1] : undefined;
        
        redis = new Redis({
          host: host || 'localhost',
          port: parseInt(port || '6379'),
          password,
          tls: { servername: host || 'localhost' },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          reconnectOnError(err) {
            const targetErrors = ['READONLY', 'ECONNRESET'];
            return targetErrors.some(target => err.message.includes(target));
          },
        });
      } else {
        // Local Redis format
        const parts = connString.split(',');
        const [host, port] = (parts[0] || '').split(':');
        const passwordPart = parts.find(p => p.includes('password='));
        const password = passwordPart ? passwordPart.split('=')[1] : undefined;
        
        redis = new Redis({
          host: host || 'localhost',
          port: parseInt(port || '6379'),
          password,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      redis.on('connect', () => {
        logger.info('Redis client connected', { type: isAzure ? 'Azure' : 'Local' });
        isConnected = true;
      });

      redis.on('ready', () => {
        logger.info('Redis client ready');
        isConnected = true;
      });

      redis.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        isConnected = false;
      });

      redis.on('close', () => {
        logger.warn('Redis connection closed');
        isConnected = false;
      });

      redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

    } catch (error) {
      logger.error('Failed to create Redis client', error);
      return null;
    }
  }

  return redis;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isConnected && redis !== null;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection', error);
    }
    redis = null;
    isConnected = false;
  }
}

/**
 * Ping Redis to check connection
 */
export async function pingRedis(): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return false;
  }

  try {
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed', error);
    return false;
  }
}

