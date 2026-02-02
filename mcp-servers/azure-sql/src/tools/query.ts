/**
 * Query Database Tool
 * Executes SELECT queries with safety validations
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConnection } from '../database.js';
import type { QueryResult } from '../types.js';

export function registerQueryTool(server: McpServer) {
  (server as unknown as { tool: Function }).tool(
    'query_database',
    {
      query: z.string().describe('SQL SELECT query to execute'),
      maxRows: z.number().default(1000).describe('Maximum rows to return (default: 1000)'),
      timeout: z.number().default(120).describe('Query timeout in seconds (default: 120, max: 300)'),
    },
    async ({ query, maxRows, timeout }: { query: string; maxRows: number; timeout: number }) => {
      try {
        // Validate query is SELECT or WITH (CTE) only
        const cleanedQuery = query
          .trim()
          .replace(/--.*$/gm, '')  // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
          .trim();

        const upperQuery = cleanedQuery.toUpperCase();
        
        if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
          throw new Error('Only SELECT and WITH (CTE) queries are allowed');
        }

        // Block dangerous keywords
        const dangerousKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE'];
        for (const keyword of dangerousKeywords) {
          if (upperQuery.includes(keyword)) {
            throw new Error(`Query contains forbidden keyword: ${keyword}`);
          }
        }

        // Calculate timeout: user-provided (capped at 300s) or default 120s
        const timeoutMs = Math.min(timeout || 120, 300) * 1000;
        console.error(`[query_database] Executing query (max ${maxRows} rows, timeout ${timeoutMs / 1000}s)`);
        
        const pool = await getConnection();
        
        // Check if query already has TOP clause
        const hasTopClause = /SELECT\s+TOP\s+\d+/i.test(cleanedQuery);
        const isCTE = upperQuery.startsWith('WITH');
        
        let finalQuery: string;
        
        if (isCTE || hasTopClause) {
          // Use query as-is
          finalQuery = cleanedQuery;
        } else {
          // Wrap in subquery with TOP
          finalQuery = `SELECT TOP ${maxRows} * FROM (${cleanedQuery}) AS subquery`;
        }

        const request = pool.request();
        (request as unknown as { timeout: number }).timeout = timeoutMs;
        const result = await request.query(finalQuery);

        const queryResult: QueryResult = {
          columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]!) : [],
          rows: result.recordset,
          rowCount: result.recordset.length,
        };

        console.error(`[query_database] Success: ${queryResult.rowCount} rows returned`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(queryResult, null, 2)
          }]
        };
      } catch (error) {
        console.error('[query_database] Error:', error);
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
