/**
 * Stored Procedure Tools
 * Tools for listing and executing stored procedures
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConnection } from '../database.js';
import type { StoredProcedureInfo, StoredProcedureResult } from '../types.js';

export function registerStoredProcedureTools(server: McpServer) {
  // List all stored procedures
  (server as unknown as { tool: Function }).tool(
    'list_stored_procedures',
    {},
    async () => {
      try {
        console.error('[list_stored_procedures] Fetching stored procedures...');
        
        const pool = await getConnection();
        const result = await pool.request().query<StoredProcedureInfo>(`
          SELECT 
            ROUTINE_NAME,
            ROUTINE_SCHEMA,
            CREATED,
            LAST_ALTERED
          FROM INFORMATION_SCHEMA.ROUTINES
          WHERE ROUTINE_TYPE = 'PROCEDURE'
            AND ROUTINE_SCHEMA = 'dbo'
          ORDER BY ROUTINE_NAME
        `);

        console.error(`[list_stored_procedures] Success: ${result.recordset.length} procedures found`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              procedures: result.recordset,
              count: result.recordset.length
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('[list_stored_procedures] Error:', error);
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

  // Get stored procedure parameters
  (server as unknown as { tool: Function }).tool(
    'describe_stored_procedure',
    {
      procedureName: z.string().describe('Stored procedure name'),
    },
    async ({ procedureName }: { procedureName: string }) => {
      try {
        console.error(`[describe_stored_procedure] Describing: ${procedureName}`);
        
        const pool = await getConnection();
        const result = await pool.request().query(`
          SELECT 
            PARAMETER_NAME,
            DATA_TYPE,
            PARAMETER_MODE,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.PARAMETERS
          WHERE SPECIFIC_NAME = '${procedureName}'
          ORDER BY ORDINAL_POSITION
        `);

        console.error(`[describe_stored_procedure] Success: ${result.recordset.length} parameters`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              procedureName,
              parameters: result.recordset,
              parameterCount: result.recordset.length
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('[describe_stored_procedure] Error:', error);
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

  // Execute stored procedure
  (server as unknown as { tool: Function }).tool(
    'execute_stored_procedure',
    {
      procedureName: z.string().describe('Stored procedure name (e.g., sp_ProfitabilityData)'),
      parameters: z.record(z.string(), z.unknown()).default({}).describe('Parameters as key-value pairs (e.g., {"DateFrom": "2024-01-01", "DateTo": "2024-12-31"})'),
      timeout: z.number().default(120).describe('Execution timeout in seconds (default: 120, max: 300)'),
    },
    async ({ procedureName, parameters, timeout }: { procedureName: string; parameters: Record<string, unknown>; timeout: number }) => {
      try {
        // Calculate timeout: user-provided (capped at 300s) or default 120s
        const timeoutMs = Math.min(timeout || 120, 300) * 1000;
        console.error(`[execute_stored_procedure] Executing: ${procedureName} (timeout ${timeoutMs / 1000}s)`);
        if (parameters) {
          console.error(`[execute_stored_procedure] Parameters:`, parameters);
        }
        
        const pool = await getConnection();
        const request = pool.request();
        (request as unknown as { timeout: number }).timeout = timeoutMs;

        // Add parameters if provided
        if (parameters) {
          for (const [key, value] of Object.entries(parameters)) {
            request.input(key, value);
          }
        }

        const result = await request.execute(procedureName);

        const procResult: StoredProcedureResult = {
          recordsets: result.recordsets as unknown[][],
          rowsAffected: result.rowsAffected,
          returnValue: result.returnValue,
        };

        console.error(`[execute_stored_procedure] Success: ${result.recordsets.length} recordset(s) returned`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              procedureName,
              recordsetCount: result.recordsets.length,
              recordsets: result.recordsets,
              rowsAffected: result.rowsAffected,
              returnValue: result.returnValue
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('[execute_stored_procedure] Error:', error);
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
