/**
 * Execute SQL Tool
 * Executes INSERT, UPDATE, DELETE commands with confirmation
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConnection } from '../database.js';
import type { ExecuteResult } from '../types.js';

export function registerExecuteTool(server: McpServer) {
  server.tool(
    'execute_sql',
    {
      sql: z.string().describe('SQL command to execute (INSERT, UPDATE, DELETE, or stored procedure)'),
      confirm: z.boolean().describe('Must be true to execute (safety confirmation)'),
    },
    async ({ sql, confirm }) => {
      try {
        // Require explicit confirmation
        if (!confirm) {
          throw new Error('Must set confirm=true to execute. This is a safety measure for data modification commands.');
        }

        // Validate SQL is not empty
        const trimmedSql = sql.trim();
        if (!trimmedSql) {
          throw new Error('SQL command cannot be empty');
        }

        console.error('[execute_sql] Executing command...');
        
        const pool = await getConnection();
        const result = await pool.request().query(trimmedSql);

        const executeResult: ExecuteResult = {
          rowsAffected: result.rowsAffected[0] || 0,
          message: `Executed successfully. Rows affected: ${result.rowsAffected[0] || 0}`
        };

        console.error(`[execute_sql] Success: ${executeResult.rowsAffected} rows affected`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(executeResult, null, 2)
          }]
        };
      } catch (error) {
        console.error('[execute_sql] Error:', error);
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
