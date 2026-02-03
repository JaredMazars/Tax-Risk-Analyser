# Client Details Optimization - Quick Start Guide

**TL;DR**: Client details page is slow (8-12s) because WIP balance queries scan 5.7M rows. Solution: Add ClientCode to WIPTransactions and create indexes. Expected: 1-2s page load.

---

## 🚀 Deployment Steps (30 minutes)

### 1. Run Migration (20-25 min)

```bash
# Option A: sqlcmd
sqlcmd -S <server> -d <database> \
  -i prisma/migrations/20260203_missing_indexes_optimization/migration.sql

# Option B: Azure Data Studio / SSMS
# Open migration.sql and click Execute
```

**What it does**:
- Adds ClientCode column to WIPTransactions
- Backfills 5.7M rows (batched, ~15 min)
- Creates 5 covering indexes (~10 min)
- Updates statistics

### 2. Update Stored Procedure (2 min)

**File**: `prisma/procedures/sp_ProfitabilityData.sql`

**Add after line 120**:

```sql
-- ClientCode filter (NEW - enables index seek)
IF @ClientCode != '*' SET @sql = @sql + N' AND w.ClientCode = @p_ClientCode'
```

**Update parameter list (line 129)**:

```sql
SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, 
    @p_ClientCode nvarchar(max), @p_PartnerCode nvarchar(max), 
    @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max), 
    @p_TaskCode nvarchar(max), @p_EmpCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo,
    @p_ClientCode = @ClientCode,  -- NEW LINE
    @p_PartnerCode = @PartnerCode,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode,
    @p_TaskCode = @TaskCode,
    @p_EmpCode = @EmpCode
```

**Deploy**:
```bash
sqlcmd -S <server> -d <database> -i prisma/procedures/sp_ProfitabilityData.sql
```

### 3. Test (3 min)

```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Test client details query
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = 'YOURCLIENT',
    @DateFrom = '1900-01-01',
    @DateTo = '2099-12-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';

-- ✓ Should see: Index Seek on IX_WIPTransactions_ClientTaskCode_Covering
-- ✓ Logical reads < 1000 (down from 50,000+)
-- ✓ Elapsed time < 500ms (down from 5-10s)
```

### 4. Verify in App (1 min)

1. Open client details page
2. Should load in < 2 seconds (was 8-12s)
3. Check balances match previous values

**Done!** 🎉

---

## 🔍 What Changed?

### Before
```
User → API → sp_ProfitabilityData:
  Step 1: Aggregate ALL 5.7M WIP rows
  Step 2: Filter to client (throws away 99%)
  ⏱️ 5-10 seconds
```

### After
```
User → API → sp_ProfitabilityData:
  Step 1: Filter to client FIRST (uses new index)
  Step 2: Aggregate only ~100 rows
  ⏱️ 300-500ms
```

**Key**: ClientCode now exists in WIPTransactions, enabling direct filtering.

---

## 📊 Monitoring (Next 48 Hours)

### Check Index Usage

```sql
-- Should show high Seeks, low Scans
SELECT 
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.last_user_seek AS LastSeek
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE i.name LIKE 'IX_WIPTransactions_%Covering'
ORDER BY s.user_seeks DESC;
```

### Check Performance

```sql
-- Should show avg < 500ms
SELECT 
    qs.execution_count AS Executions,
    qs.total_elapsed_time / qs.execution_count / 1000.0 AS AvgElapsedMs,
    qs.last_execution_time AS LastRun
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%sp_ProfitabilityData%'
AND qs.last_execution_time > DATEADD(HOUR, -24, GETDATE())
ORDER BY qs.last_execution_time DESC;
```

---

## 🆘 Rollback (If Needed)

If something goes wrong:

```sql
-- 1. Drop indexes (keeps ClientCode column)
DROP INDEX [IX_WIPTransactions_ClientTaskCode_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_Partner_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_PartnerDate_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_Task_ServLine_Covering] ON [dbo].[Task];
DROP INDEX [IX_Task_Partner_Covering] ON [dbo].[Task];

-- 2. Revert stored procedure
git checkout HEAD~1 prisma/procedures/sp_ProfitabilityData.sql
sqlcmd -S <server> -d <database> -i prisma/procedures/sp_ProfitabilityData.sql
```

---

## ❓ FAQ

**Q: Will My Reports break?**  
A: No. My Reports use Partner/Manager filters (unchanged). They'll actually be faster thanks to new indexes.

**Q: How long is downtime?**  
A: 20-25 minutes for migration. Use ONLINE mode, but schedule during low-usage period.

**Q: What if backfill fails?**  
A: Transaction rolls back automatically. Fix issue and retry.

**Q: Can I test first?**  
A: Yes! Use staging with production data snapshot. Migration is idempotent (safe to rerun).

---

## 📚 Full Documentation

- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)** - Executive summary
- **[CLIENT_DETAILS_OPTIMIZATION.md](./CLIENT_DETAILS_OPTIMIZATION.md)** - Technical deep dive
- **[MISSING_INDEXES_ANALYSIS.md](./MISSING_INDEXES_ANALYSIS.md)** - Index analysis
- **[Migration README](../../prisma/migrations/20260203_missing_indexes_optimization/README.md)** - Detailed instructions

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Migration completed without errors
- [ ] 5 new indexes created successfully
- [ ] sp_ProfitabilityData updated and deployed
- [ ] Client details page loads in < 2 seconds
- [ ] WIP balances match previous values (regression test)
- [ ] Index usage stats show Seeks > Scans
- [ ] No errors in application logs
- [ ] User feedback: "It's fast now!"

---

## 🎯 Expected Results

| Metric | Before | After | Status |
|---|---|---|---|
| Page load time | 8-12s | 1-2s | ⏳ Verify |
| SP execution | 5-10s | 300-500ms | ⏳ Verify |
| Logical reads | 50,000+ | < 1,000 | ⏳ Verify |
| User satisfaction | 😞 | 😊 | ⏳ Verify |

---

## 🤝 Support

If you need help:
1. Check migration output for errors
2. Review execution plans: `SET SHOWPLAN_ALL ON`
3. Verify indexes: `SELECT * FROM sys.indexes WHERE name LIKE 'IX_%Covering'`
4. Check application logs
5. Use rollback plan if necessary

**Questions?** Refer to detailed documentation linked above.
