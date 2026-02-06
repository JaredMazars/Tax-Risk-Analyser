# Database Maintenance Scripts

Comprehensive SQL Server maintenance toolkit for diagnosing and resolving slow stored procedure performance.

## 📋 Quick Start

**Your stored procedures are slow? Start here:**

1. **First, check if plan cache needs clearing** (most common fix):
   ```sql
   -- Run this in SSMS to clear old cached plans
   sqlcmd -S your_server -d your_database -i 05_clear_procedure_cache.sql
   ```

2. **Check what's currently running**:
   ```sql
   sqlcmd -S your_server -d your_database -i 01_check_running_processes.sql
   ```

3. **Analyze stored procedure performance**:
   ```sql
   sqlcmd -S your_server -d your_database -i 04_analyze_sp_performance.sql
   ```

## 📁 Script Overview

| Script | Purpose | When to Run | Duration |
|---|---|---|---|
| **00_daily_maintenance.sql** | Combined daily routine | Daily 2:00 AM (automated) | 15-20 min |
| **01_check_running_processes.sql** | Monitor active sessions, blocking | When users report slowness | < 1 min |
| **02_update_statistics.sql** | Update stats for query optimizer | Weekly, after bulk changes | 5-10 min |
| **03_rebuild_indexes.sql** | Fix fragmented indexes | Monthly, or when > 30% fragmented | 10-30 min |
| **04_analyze_sp_performance.sql** | Diagnose slow stored procedures | Weekly, during troubleshooting | 1-2 min |
| **05_clear_procedure_cache.sql** | Clear old cached query plans | After index changes, stat updates | < 1 min |

---

## 🔧 Detailed Script Guide

### 00_daily_maintenance.sql - Automated Daily Routine

**Purpose**: Comprehensive maintenance combining health checks, statistics updates, fragmentation analysis, and performance monitoring.

**Recommended Setup**: SQL Server Agent Job
```sql
-- Job Name: Daily Database Maintenance
-- Schedule: Daily at 02:00 AM
-- Duration: 15-20 minutes
-- Safe during business hours if needed
```

**What It Does**:
1. ✅ Checks for blocking queries
2. ✅ Checks for long-running queries (> 1 minute)
3. ✅ Updates statistics on key tables (WIPTransactions, DrsTransactions, Task, etc.)
4. ✅ Analyzes index fragmentation
5. ✅ Reports stored procedure performance
6. ✅ Captures system health metrics

**Output**: Comprehensive report with action items if issues detected.

---

### 01_check_running_processes.sql - Process Monitoring

**Purpose**: Identify blocking, long-running queries, and resource-intensive sessions.

**When to Run**:
- Users report system slowness
- Stored procedures taking longer than usual
- During high-load periods
- As part of troubleshooting workflow

**What It Analyzes**:
1. **Active Sessions** (sp_who2 alternative)
   - Shows all active connections with CPU, I/O, wait times
2. **Blocking Chains**
   - WHO is blocking WHOM
   - Shows wait resources and SQL text of blocked queries
3. **Long-Running Queries** (> 30 seconds)
   - Full SQL text with execution stats
4. **Resource-Intensive Sessions**
   - High I/O operations
5. **Wait Statistics**
   - Current wait types (disk I/O, locks, parallelism)
6. **Stored Procedure Execution**
   - Which SPs are currently running

**How to Interpret**:
```
ElapsedSec > 30: Query is slow
BlockedBy > 0: Session waiting on another session (blocking)
High LogicalReads: Lots of I/O (check for missing indexes)
WaitType = PAGEIOLATCH_*: Disk I/O bottleneck
WaitType = LCK_*: Locking contention
WaitType = CXPACKET: Parallelism waits (normal for large queries)
```

---

### 02_update_statistics.sql - Statistics Maintenance

**Purpose**: Update statistics so SQL Server query optimizer can choose optimal execution plans.

**Why Statistics Matter**:
- Query optimizer uses statistics to estimate row counts
- Stale statistics → poor execution plans (table scans instead of index seeks)
- SQL Server auto-updates, but not always frequently enough
- **Critical after bulk data changes** (imports, deletes > 10% of rows)

**When to Run**:
- **Weekly** for transaction tables (WIPTransactions, DrsTransactions)
- **After bulk operations** (imports, deletes)
- **When SPs suddenly slow down**
- **After creating new indexes** (required!)

**Tables Updated**:
1. WIPTransactions (5.7M rows) - **Most critical**
2. DrsTransactions (1M+ rows)
3. Task (100K+ rows)
4. Client
5. Employee
6. Debtors
7. Wip

**Performance Impact**:
- Uses `WITH FULLSCAN` for most accurate stats
- Creates brief shared table locks (typically < 1 second)
- **Safe to run during business hours**

**After Running**:
- Clear procedure cache to force recompilation with new stats:
  ```sql
  DBCC FREEPROCCACHE;
  ```
- Or recompile specific SP:
  ```sql
  EXEC sp_recompile 'sp_ProfitabilityData';
  ```

---

### 03_rebuild_indexes.sql - Index Maintenance

**Purpose**: Reduce index fragmentation to improve query performance.

**What Is Fragmentation**:
- **Logical**: Index pages not in sequential order
- **Physical**: Data pages not contiguous on disk
- **Effect**: Extra I/O operations, slower queries
- **Cause**: Builds up with inserts/updates/deletes over time

**Fragmentation Thresholds**:
| Fragmentation | Action | Method | Business Hours Safe? |
|---|---|---|---|
| < 10% | ✅ NONE | Index is healthy | N/A |
| 10-30% | ⚠️ REORGANIZE | Online, faster | ✅ Yes |
| > 30% | 🔴 REBUILD | Offline or ONLINE=ON | ⚠️ Depends* |

\* REBUILD with `ONLINE=ON` requires Enterprise Edition

**When to Run**:
- **Monthly** for transaction tables
- **Weekly** if heavy insert/update/delete activity
- **After bulk data operations**
- **When queries slow despite good statistics**

**How to Use**:
1. Run **PART 1: ANALYZE FRAGMENTATION** first (always safe)
2. Review recommendations
3. Uncomment **PART 2: EXECUTE MAINTENANCE** during appropriate window:
   - **REORGANIZE**: Safe during business hours
   - **REBUILD**: Off-hours unless Enterprise Edition with ONLINE=ON

**Output**: Shows which indexes need maintenance and performs it.

---

### 04_analyze_sp_performance.sql - Stored Procedure Diagnostics

**Purpose**: Identify slow stored procedures and diagnose root causes.

**What It Analyzes**:
1. **Slowest SPs by Total Duration**
   - Which SPs consuming most database time overall
2. **Slowest SPs by Average Duration**
   - Which SPs have highest per-execution time
3. **High I/O SPs**
   - Which SPs doing excessive logical reads (memory + disk)
4. **Parameter Sniffing Candidates**
   - SPs with high variance (min vs max execution time)
   - Indicates cached plan not optimal for all parameters
5. **Query Plan Analysis**
   - Checks for table scans, missing indexes
   - Analyzes seek vs scan ratios
6. **Recompilation Statistics**
   - How often SPs are recompiling
   - Age of cached plans

**When to Run**:
- **Weekly** performance monitoring
- **When users report slowness**
- **After deploying new stored procedures**
- **After applying index changes**

**Key Metrics**:
```
AvgMs: Average execution time in milliseconds
  Target: < 500ms for most queries
  
AvgReads: Average logical reads
  Target: < 10,000 for client queries
          < 50,000 for complex reports
  
MaxMinRatio: Max time / Min time
  > 10: Strong parameter sniffing indicator
  
TableScanStatus: "TABLE SCAN DETECTED" = Bad (especially on large tables)
```

**Recommendations**:
- **For slow SPs**: Check query plans, add missing indexes
- **For high I/O**: Review execution plans, create covering indexes
- **For parameter sniffing**: Add `OPTION (RECOMPILE)` or use dynamic SQL
- **For old plans**: Clear procedure cache or recompile specific SP

---

### 05_clear_procedure_cache.sql - Force Query Plan Recompilation

**Purpose**: Clear old cached query plans and force recompilation with current statistics and indexes.

**When to Run** (CRITICAL):
- ✅ **After creating new indexes** (REQUIRED!)
- ✅ **After updating statistics** (Recommended)
- ✅ **After schema changes**
- ✅ **When SPs slow despite healthy indexes/stats**
- ✅ **After missing indexes migration was applied**

**Why This Matters**:
Your stored procedures may be using cached query plans that were compiled **before** the new indexes existed. Even though the indexes are now present, SQL Server continues using the old plan (which does table scans instead of index seeks).

**Two Options**:

**Option 1: Clear ALL cached plans** (nuclear option)
```sql
DBCC FREEPROCCACHE;  -- Clears entire plan cache
```
- ✅ Ensures all SPs recompile with new indexes/stats
- ⚠️ Causes temporary CPU spike as plans recompile
- ⚠️ Safe but may cause brief slowdown

**Option 2: Recompile specific SPs** (surgical approach)
```sql
EXEC sp_recompile 'sp_ProfitabilityData';
EXEC sp_recompile 'sp_WipMonthly';
EXEC sp_recompile 'sp_DrsMonthly';
-- etc.
```
- ✅ More controlled
- ✅ No system-wide impact
- ⚠️ Must do each SP individually

**Recommended Workflow**:
```sql
-- 1. Clear cache
DBCC FREEPROCCACHE;

-- 2. Wait 5 minutes for plans to recompile

-- 3. Test SP performance
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

EXEC sp_ProfitabilityData @ClientCode = 'TEST001', @DateFrom = '2024-09-01';

-- 4. Verify improvement (should see index seeks instead of scans)
```

---

## 🎯 Common Troubleshooting Workflows

### Workflow 1: "Stored Procedures Are Slow"

```bash
# Step 1: Check current activity
sqlcmd -S server -d database -i 01_check_running_processes.sql
# Look for: Blocking, long-running queries, high I/O

# Step 2: Clear procedure cache (most common fix if indexes already in place)
sqlcmd -S server -d database -i 05_clear_procedure_cache.sql

# Step 3: Analyze SP performance
sqlcmd -S server -d database -i 04_analyze_sp_performance.sql
# Look for: High AvgMs, table scans, parameter sniffing

# Step 4: Update statistics if stale
sqlcmd -S server -d database -i 02_update_statistics.sql

# Step 5: Check index fragmentation
sqlcmd -S server -d database -i 03_rebuild_indexes.sql
```

### Workflow 2: "After Applying Missing Indexes Migration"

```bash
# CRITICAL: Indexes are in place but SPs still using old plans

# Step 1: Verify indexes exist
sqlcmd -S server -d database -Q "SELECT name FROM sys.indexes WHERE name LIKE 'IX_%Covering'"

# Step 2: Clear procedure cache (REQUIRED!)
sqlcmd -S server -d database -i 05_clear_procedure_cache.sql

# Step 3: Update statistics
sqlcmd -S server -d database -i 02_update_statistics.sql

# Step 4: Test SP performance
sqlcmd -S server -d database -Q "SET STATISTICS IO ON; EXEC sp_ProfitabilityData @ClientCode = 'TEST001'"
```

### Workflow 3: "After Bulk Data Import"

```bash
# Step 1: Update statistics (CRITICAL after bulk changes)
sqlcmd -S server -d database -i 02_update_statistics.sql

# Step 2: Check index fragmentation
sqlcmd -S server -d database -i 03_rebuild_indexes.sql
# Rebuild if > 30% fragmented

# Step 3: Clear procedure cache
sqlcmd -S server -d database -i 05_clear_procedure_cache.sql
```

### Workflow 4: "User Reports System Is Slow Right Now"

```bash
# Step 1: Check running processes (IMMEDIATE)
sqlcmd -S server -d database -i 01_check_running_processes.sql
# Look for: Blocking chains, long-running queries

# If blocking detected:
sqlcmd -S server -d database -Q "KILL <blocked_spid>"  # Only if safe to do so

# Step 2: Check SP performance
sqlcmd -S server -d database -i 04_analyze_sp_performance.sql
```

---

## 📊 Performance Targets

| Stored Procedure | Current | Target | Method to Achieve |
|---|---|---|---|
| sp_ProfitabilityData (client) | 5-10s | 300-500ms | ClientCode index + clear cache |
| sp_ProfitabilityData (partner) | 3-5s | 500-800ms | Partner index + clear cache |
| sp_WipMonthly | 2-3s | 400-600ms | Partner/Manager indexes + stats |
| sp_DrsMonthly | 1-2s | 200-400ms | Biller index + stats |

---

## 🔄 SQL Server Agent Job Setup

**Automated Daily Maintenance:**

1. Open **SQL Server Management Studio** (SSMS)
2. Expand **SQL Server Agent** → **Jobs**
3. Right-click **Jobs** → **New Job**
4. **General Tab**:
   - Name: `Daily Database Maintenance`
   - Category: `Database Maintenance`
   - Description: `Automated statistics update, fragmentation check, and performance monitoring`
5. **Steps Tab** → **New**:
   - Step name: `Run Daily Maintenance`
   - Type: `Transact-SQL script (T-SQL)`
   - Database: `[Your database name]`
   - Command: Copy contents of `00_daily_maintenance.sql`
6. **Schedules Tab** → **New**:
   - Name: `Daily 2 AM`
   - Frequency: `Daily` at `02:00:00`
   - Enabled: ✅ Yes
7. **Notifications Tab**:
   - Configure email alerts on failure (requires Database Mail setup)
8. Click **OK** to save job

**Test Job**:
```sql
-- Right-click job → Start Job at Step
-- Review Job History for output
```

---

## 🚨 Current Database Health Status

Based on MCP tests run on 2026-02-03:

### ✅ Excellent Health

- **Missing Indexes Migration**: ✅ Applied (all 5 indexes exist and enabled)
- **ClientCode Column**: ✅ Exists in WIPTransactions
- **Index Fragmentation**: ✅ Excellent (all < 1% - GOOD status)
- **Statistics**: ✅ Current (all updated today, 0 days old)

### ⚠️ Likely Issue: Stale Query Plans

**Problem**: Indexes are perfect, but stored procedures may be using **cached plans compiled before indexes existed**.

**Solution**: Run `05_clear_procedure_cache.sql` to force recompilation.

---

## 📚 Related Documentation

- **[Missing Indexes Analysis](../docs/optimization/MISSING_INDEXES_ANALYSIS.md)** - Detailed analysis of 16 missing indexes (1.5M improvement points)
- **[Stored Procedure Rules](../.cursor/rules/stored-procedure-rules.mdc)** - SP optimization patterns
- **[Database Patterns](../.cursor/rules/database-patterns.mdc)** - Database conventions
- **[Performance Rules](../.cursor/rules/performance-rules.mdc)** - General performance guidelines

---

## 🔧 Command Line Usage

**Using sqlcmd** (Windows Command Prompt or PowerShell):

```powershell
# Single script execution
sqlcmd -S your_server_name -d your_database_name -i 01_check_running_processes.sql

# With output to file
sqlcmd -S your_server_name -d your_database_name -i 00_daily_maintenance.sql -o maintenance_log.txt

# With Windows Authentication
sqlcmd -S your_server_name -d your_database_name -E -i 01_check_running_processes.sql

# With SQL Server Authentication
sqlcmd -S your_server_name -d your_database_name -U username -P password -i 02_update_statistics.sql
```

**Using SSMS**:

1. Open script in SSMS (File → Open → File)
2. Select correct database in dropdown
3. Press F5 or click Execute
4. Review results in Messages and Results tabs

---

## ⚙️ Configuration

All scripts are self-contained and require no configuration. However, you can customize:

**Tables to Maintain** - Edit these scripts to add/remove tables:
- `02_update_statistics.sql` - Add additional tables to statistics update
- `03_rebuild_indexes.sql` - Modify table filter in fragmentation query

**Thresholds** - Adjust performance thresholds:
- `01_check_running_processes.sql` - Change long-running threshold (currently 30 seconds)
- `04_analyze_sp_performance.sql` - Adjust slow query thresholds (currently 1 second avg)

---

## 🆘 Support & Troubleshooting

**Scripts not running?**
- Verify SQL Server Agent is running: Services → SQL Server Agent (instance name)
- Check job history: SQL Server Agent → Jobs → Right-click job → View History

**Permission errors?**
- Requires `VIEW SERVER STATE` permission
- Some operations require `db_ddladmin` or `sysadmin`

**Need help interpreting results?**
- Each script includes interpretation guide in output
- See "Common Troubleshooting Workflows" section above
- Consult related documentation files

---

## 📝 Version History

- **v1.0** (2026-02-03): Initial release
  - 6 maintenance scripts created
  - Comprehensive documentation
  - Tested with mapper database structure
