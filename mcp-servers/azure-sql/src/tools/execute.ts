/**
 * Execute SQL Tool
 * Executes INSERT, UPDATE, DELETE commands with confirmation
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConnection } from '../database.js';
import type { ExecuteResult } from '../types.js';

export function registerExecuteTool(server: McpServer) {
  (server as unknown as { tool: Function }).tool(
    'execute_sql',
    {
      sql: z.string().describe('SQL command to execute (INSERT, UPDATE, DELETE, CREATE INDEX, CREATE/ALTER PROCEDURE, etc.)'),
      confirm: z.boolean().describe('Must be true to execute (safety confirmation)'),
      timeout: z.number().default(120).describe('Execution timeout in seconds (default: 120, max: 600 for DDL operations)'),
    },
    async ({ sql, confirm, timeout }: { sql: string; confirm: boolean; timeout: number }) => {
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

        // Calculate timeout: user-provided (capped at 600s for DDL) or default 120s
        const timeoutMs = Math.min(timeout || 120, 600) * 1000;
        console.error(`[execute_sql] Executing command (timeout ${timeoutMs / 1000}s)...`);
        
        const pool = await getConnection();
        const request = pool.request();
        (request as unknown as { timeout: number }).timeout = timeoutMs;
        const result = await request.query(trimmedSql);

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
