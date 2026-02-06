/**
 * Shared TypeScript types for Azure SQL MCP Server
 */

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface ExecuteResult {
  rowsAffected: number;
  message: string;
}

export interface TableInfo {
  TABLE_NAME: string;
  TABLE_TYPE: string;
}

export interface ColumnInfo {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
}

export interface IndexInfo {
  TableName: string;
  IndexName: string;
  IndexType: string;
  Columns: string;
}

export interface StoredProcedureInfo {
  ROUTINE_NAME: string;
  ROUTINE_SCHEMA: string;
  CREATED: Date;
  LAST_ALTERED: Date;
}

export interface StoredProcedureResult {
  recordsets: unknown[][];
  rowsAffected: number[];
  returnValue: number;
}
