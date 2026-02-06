/**
 * Data Transfer Objects (DTOs)
 * Define the shape of data transferred between client and server
 */

import { ServiceLine, ServiceLineRole } from './index';

/**
 * Generic pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * DTO for service line with stats
 */
export interface ServiceLineWithStats {
  id?: number;
  serviceLine: ServiceLine;
  role: ServiceLineRole;
  taskCount: number;
  activeTaskCount: number;
  name?: string;
  description?: string;
  subGroups?: Array<{
    code: string;
    description: string;
  }>;
}

/**
 * External Link (from database)
 */
export interface ExternalLink {
  id: number;
  name: string;
  url: string;
  icon: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
