/**
 * MCP Server Setup
 * Configures and starts the Azure SQL MCP server with stdio transport
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerQueryTool } from './tools/query.js';
import { registerExecuteTool } from './tools/execute.js';
import { registerSchemaTools } from './tools/schema.js';
import { registerStoredProcedureTools } from './tools/procedures.js';

/**
 * Create and configure MCP server with all tools
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: 'azure-sql-server',
    version: '1.0.0',
  });

  console.error('[Server] Registering tools...');

  // Register all tools
  registerQueryTool(server);
  registerExecuteTool(server);
  registerSchemaTools(server);
  registerStoredProcedureTools(server);

  console.error('[Server] All tools registered successfully');

  return server;
}

/**
 * Start MCP server with stdio transport
 */
export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  
  console.error('[Server] Azure SQL MCP Server started on stdio');
  console.error('[Server] Ready to accept connections');
}
