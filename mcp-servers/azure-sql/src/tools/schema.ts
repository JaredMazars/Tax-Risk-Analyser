/**
 * Schema Inspection Tools
 * Tools for exploring database structure (tables, columns, indexes)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import sql from 'mssql';
import { getConnection } from '../database.js';
import type { TableInfo, ColumnInfo, IndexInfo } from '../types.js';

export function registerSchemaTools(server: McpServer) {
  // List all tables
  (server as unknown as { tool: Function }).tool(
    'list_tables',
    {},
    async () => {
      try {
        console.error('[list_tables] Fetching table list...');
        
        const pool = await getConnection();
        const result = await pool.request().query<TableInfo>(`
          SELECT TABLE_NAME, TABLE_TYPE
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = 'dbo'
          ORDER BY TABLE_NAME
        `);

        console.error(`[list_tables] Success: ${result.recordset.length} tables found`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              tables: result.recordset,
              count: result.recordset.length
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('[list_tables] Error:', error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Describe table structure
  (server as unknown as { tool: Function }).tool(
    'describe_table',
    {
      tableName: z.string().describe('Table name to describe'),
    },
    async ({ tableName }: { tableName: string }) => {
      try {
        console.error(`[describe_table] Describing table: ${tableName}`);
        
        const pool = await getConnection();
        const result = await pool.request()
          .input('tableName', sql.NVarChar, tableName)
          .query<ColumnInfo>(`
            SELECT 
              COLUMN_NAME,
              DATA_TYPE,
              CHARACTER_MAXIMUM_LENGTH,
              IS_NULLABLE,
              COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = @tableName
            ORDER BY ORDINAL_POSITION
          `);

        if (result.recordset.length === 0) {
          throw new Error(`Table '${tableName}' not found`);
        }

        console.error(`[describe_table] Success: ${result.recordset.length} columns`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              tableName,
              columns: result.recordset,
              columnCount: result.recordset.length
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('[describe_table] Error:', error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // List indexes
  (server as unknown as { tool: Function }).tool(
    'list_indexes',
    {
      tableName: z.string().default('').describe('Filter by table name (leave empty for all tables)'),
    },
    async ({ tableName }: { tableName: string }) => {
      try {
        console.error(`[list_indexes] Fetching indexes${tableName ? ` for table: ${tableName}` : ''}...`);
        
        const pool = await getConnection();
        let query = `
          SELECT 
            OBJECT_NAME(i.object_id) AS TableName,
            i.name AS IndexName,
            i.type_desc AS IndexType,
            STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.name IS NOT NULL
        `;
        
        if (tableName) {
          query += ` AND OBJECT_NAME(i.object_id) = @tableName`;
        }
        
        query += ` GROUP BY i.object_id, i.name, i.type_desc ORDER BY TableName, IndexName`;

        const request = pool.request();
        if (tableName) {
          request.input('tableName', sql.NVarChar, tableName);
        }
        
        const result = await request.query<IndexInfo>(query);

        console.error(`[list_indexes] Success: ${result.recordset.length} indexes found`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              indexes: result.recordset,
              count: result.recordset.length,
              ...(tableName && { tableName })
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('[list_indexes] Error:', error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );
}
