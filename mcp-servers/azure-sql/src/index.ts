#!/usr/bin/env node
/**
 * Azure SQL MCP Server Entry Point
 * Main entry point with graceful shutdown handling
 */

import 'dotenv/config';
import { startServer } from './server.js';
import { closeConnection, testConnection } from './database.js';

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  console.error(`\n[Shutdown] Received ${signal}, shutting down gracefully...`);
  
  try {
    await closeConnection();
    console.error('[Shutdown] Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('[Shutdown] Error during cleanup:', error);
    process.exit(1);
  }
}

/**
 * Setup shutdown handlers
 */
function setupShutdownHandlers(): void {
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[Error] Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('[Error] Unhandled rejection:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Main startup function
 */
async function main(): Promise<void> {
  try {
    console.error('[Startup] Azure SQL MCP Server starting...');
    
    // Validate environment variables
    const requiredEnvVars = ['MSSQL_SERVER', 'MSSQL_DATABASE', 'MSSQL_USER', 'MSSQL_PASSWORD'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.error('[Startup] Environment variables validated');
    
    // Test database connection
    console.error('[Startup] Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    console.error('[Startup] Database connection successful');
    
    // Setup shutdown handlers
    setupShutdownHandlers();
    
    // Start MCP server
    await startServer();
    
    console.error('[Startup] Server initialization complete');
  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main();
