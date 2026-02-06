/**
 * Database Connection Manager
 * Handles SQL Server connection pooling and configuration
 */

import sql from 'mssql';

const config: sql.config = {
  server: process.env.MSSQL_SERVER!,
  database: process.env.MSSQL_DATABASE!,
  user: process.env.MSSQL_USER!,
  password: process.env.MSSQL_PASSWORD!,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 120000, // 2 minutes for complex queries/stored procedures
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 60000, // 60s idle timeout
  },
};

let pool: sql.ConnectionPool | null = null;

/**
 * Get database connection pool
 * Creates pool on first call, reuses on subsequent calls
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    console.error('[Database] Creating new connection pool...');
    pool = await sql.connect(config);
    console.error('[Database] Connection pool created successfully');
  }
  return pool;
}

/**
 * Close database connection pool
 * Called during graceful shutdown
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    console.error('[Database] Closing connection pool...');
    await pool.close();
    pool = null;
    console.error('[Database] Connection pool closed');
  }
}

/**
 * Test database connection
 * Returns true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.request().query('SELECT 1 AS test');
    return true;
  } catch (error) {
    console.error('[Database] Connection test failed:', error);
    return false;
  }
}
