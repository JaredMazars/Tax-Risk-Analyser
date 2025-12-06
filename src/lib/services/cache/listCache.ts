/**
 * List Cache Service
 * 
 * Provides caching functionality specifically for list endpoints
 * with support for pagination, filtering, and search parameters.
 */

import { cache, CACHE_PREFIXES } from './CacheService';

// TTL for list data: 5 minutes (300 seconds)
const LIST_CACHE_TTL = 5 * 60;

// Maximum number of pages to cache per query
const MAX_CACHED_PAGES = 3;

interface ListCacheParams {
  endpoint: 'clients' | 'tasks';
  page?: number;
  limit?: number;
  serviceLine?: string;
  subServiceLineGroup?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  internalOnly?: boolean;
  clientTasksOnly?: boolean;
  myTasksOnly?: boolean;
}

/**
 * Generate a cache key for list queries
 */
export function getListCacheKey(params: ListCacheParams): string {
  const {
    endpoint,
    page = 1,
    limit = 50,
    serviceLine,
    subServiceLineGroup,
    search,
    sortBy,
    sortOrder,
    includeArchived,
    internalOnly,
    clientTasksOnly,
    myTasksOnly,
  } = params;

  // Build key components
  const components: string[] = [
    endpoint === 'clients' ? CACHE_PREFIXES.CLIENT : CACHE_PREFIXES.TASK,
    'list',
    `p${page}`,
    `l${limit}`,
  ];

  // Add optional filters
  if (serviceLine) components.push(`sl${serviceLine}`);
  if (subServiceLineGroup) components.push(`sg${subServiceLineGroup}`);
  if (search) components.push(`s${search}`);
  if (sortBy) components.push(`sb${sortBy}`);
  if (sortOrder) components.push(`so${sortOrder}`);
  if (includeArchived) components.push('arch');
  if (internalOnly) components.push('int');
  if (clientTasksOnly) components.push('client');
  if (myTasksOnly) components.push('my');

  return components.join(':');
}

/**
 * Get cached list data
 */
export async function getCachedList<T>(params: ListCacheParams): Promise<T | null> {
  const { page = 1, search } = params;

  // Skip cache for searches (too many permutations)
  if (search && search.length > 0) {
    return null;
  }

  // Only cache first few pages
  if (page > MAX_CACHED_PAGES) {
    return null;
  }

  const cacheKey = getListCacheKey(params);
  return await cache.get<T>(cacheKey);
}

/**
 * Set cached list data
 */
export async function setCachedList<T>(
  params: ListCacheParams,
  data: T
): Promise<void> {
  const { page = 1, search } = params;

  // Skip cache for searches
  if (search && search.length > 0) {
    return;
  }

  // Only cache first few pages
  if (page > MAX_CACHED_PAGES) {
    return;
  }

  const cacheKey = getListCacheKey(params);
  await cache.set(cacheKey, data, LIST_CACHE_TTL);
}

/**
 * Invalidate all cached lists for a specific endpoint
 */
export async function invalidateListCache(
  endpoint: 'clients' | 'tasks',
  serviceLine?: string,
  subServiceLineGroup?: string
): Promise<void> {
  const prefix = endpoint === 'clients' ? CACHE_PREFIXES.CLIENT : CACHE_PREFIXES.TASK;
  
  // Build pattern for deletion
  let pattern = `${prefix}:list`;
  
  if (serviceLine) {
    pattern = `${pattern}:*:sl${serviceLine}`;
  }
  
  if (subServiceLineGroup) {
    pattern = `${pattern}:*:sg${subServiceLineGroup}`;
  }

  await cache.invalidate(pattern);
}

/**
 * Invalidate client lists when a client is updated
 */
export async function invalidateClientListCache(clientID?: string): Promise<void> {
  // Invalidate all client lists
  await cache.invalidate(`${CACHE_PREFIXES.CLIENT}:list`);
  
  // Also invalidate the specific client detail cache if provided
  if (clientID) {
    await cache.invalidate(`${CACHE_PREFIXES.CLIENT}:${clientID}`);
  }
}

/**
 * Invalidate task lists when a task is updated
 */
export async function invalidateTaskListCache(taskId?: number): Promise<void> {
  // Invalidate all task lists
  await cache.invalidate(`${CACHE_PREFIXES.TASK}:list`);
  
  // Also invalidate the specific task detail cache if provided
  if (taskId) {
    await cache.invalidate(`${CACHE_PREFIXES.TASK}:detail:${taskId}`);
  }
}

