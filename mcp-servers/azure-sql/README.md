# Azure SQL MCP Server

Custom TypeScript MCP server for connecting Cursor AI to Azure SQL Server (gt3-db).

## Features

- **Query Database**: Execute SELECT queries with safety validations
- **Execute SQL**: Run INSERT, UPDATE, DELETE commands with confirmation
- **Schema Inspection**: List tables, describe table structures, view indexes
- **Stored Procedures**: List and execute stored procedures with parameters

## Installation

```bash
cd mcp-servers/azure-sql
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update environment variables if needed (default values work for gt3-db)

3. Build the server:

```bash
npm run build
```

## Development

Run in development mode with hot reload:

```bash
npm run dev
```

## Available Tools

### 1. query_database

Execute SELECT queries with automatic row limiting.

**Parameters:**
- `query` (string): SQL SELECT query
- `maxRows` (number, optional): Maximum rows to return (default: 1000)

**Example:**
```
Query tasks created in the last 30 days
```

### 2. execute_sql

Execute INSERT, UPDATE, DELETE commands with confirmation.

**Parameters:**
- `sql` (string): SQL command to execute
- `confirm` (boolean): Must be true (safety confirmation)

**Example:**
```
Insert a new task with confirm=true
```

### 3. list_tables

List all database tables.

**Parameters:** None

**Example:**
```
List all tables in the database
```

### 4. describe_table

Show table structure (columns, data types, constraints).

**Parameters:**
- `tableName` (string): Table name to describe

**Example:**
```
Describe the Task table structure
```

### 5. list_indexes

Show index information for tables.

**Parameters:**
- `tableName` (string, optional): Filter by table name

**Example:**
```
Show indexes on the WIPTransactions table
```

### 6. list_stored_procedures

List all stored procedures.

**Parameters:** None

**Example:**
```
What stored procedures are available?
```

### 7. describe_stored_procedure

Show stored procedure parameters.

**Parameters:**
- `procedureName` (string): Stored procedure name

**Example:**
```
Describe the sp_ProfitabilityData procedure
```

### 8. execute_stored_procedure

Execute a stored procedure with parameters.

**Parameters:**
- `procedureName` (string): Stored procedure name
- `parameters` (object, optional): Parameters as key-value pairs

**Example:**
```
Execute sp_ProfitabilityData with DateFrom="2024-01-01" and DateTo="2024-12-31"
```

## Usage in Cursor

After configuring in `~/.cursor/mcp.json` and restarting Cursor, you can use natural language queries:

- "List all tables in the database"
- "Query the Task table for tasks created this month"
- "Describe the Client table structure"
- "Execute sp_ProfitabilityData with default parameters"
- "Show me indexes on the WIPTransactions table"

## Troubleshooting

### Connection Issues

If the server fails to connect:

1. Verify environment variables in `.env`
2. Check Azure SQL Server firewall rules
3. Ensure password special characters are correct (no URL encoding needed)
4. Check logs in Cursor: View → Output → MCP Logs

### Tool Not Found

If tools don't appear in Cursor:

1. Ensure server is built: `npm run build`
2. Restart Cursor completely (Cmd+Q)
3. Check MCP configuration in `~/.cursor/mcp.json`

### Query Timeouts

If queries timeout:

1. Increase `requestTimeout` in `src/database.ts`
2. Optimize query with indexes
3. Use `maxRows` parameter to limit results

## Security Considerations

- Query tool validates SELECT/WITH queries only
- Execute tool requires explicit confirmation
- Connection uses encryption (TLS)
- No credentials stored in code (environment variables only)
- SQL injection protection via parameterized queries

## Development Notes

- Built with TypeScript and MCP SDK v1
- Uses stdio transport for Cursor integration
- Connection pooling for performance
- Comprehensive error handling and logging
- Graceful shutdown on SIGINT/SIGTERM
