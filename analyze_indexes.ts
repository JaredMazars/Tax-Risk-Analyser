/**
 * Temporary Script: Analyze WIPTransactions and DrsTransactions Indexes
 * Run with: bun run analyze_indexes.ts
 */

import { prisma } from './src/lib/db/prisma';

interface IndexInfo {
  IndexName: string;
  IndexType: string;
  IsUnique: boolean;
  HasFilter: boolean;
  FilterDef: string | null;
  KeyColumns: string | null;
  IncludedColumns: string | null;
  SizeMB: number | null;
  TotalRows: bigint | null;
}

interface IndexUsage {
  IndexName: string;
  UserSeeks: bigint | null;
  UserScans: bigint | null;
  UserLookups: bigint | null;
  UserUpdates: bigint | null;
  LastSeek: Date | null;
  LastScan: Date | null;
}

interface IndexFragmentation {
  IndexName: string;
  FragmentationPct: number;
  PageCount: bigint;
  SizeMB: number;
}

async function analyzeIndexes() {
  console.log('='.repeat(80));
  console.log('WIPTransactions and DrsTransactions Index Analysis');
  console.log('Generated:', new Date().toISOString());
  console.log('='.repeat(80));
  console.log('');

  // 1. WIPTransactions - All Indexes
  console.log('1. WIPTransactions - All Indexes');
  console.log('-'.repeat(80));
  
  const wipIndexes = await prisma.$queryRaw<IndexInfo[]>`
    SELECT 
      i.name AS IndexName,
      i.type_desc AS IndexType,
      i.is_unique AS IsUnique,
      i.has_filter AS HasFilter,
      i.filter_definition AS FilterDef,
      STUFF((
        SELECT ', ' + c.name + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id
        AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
      ), 1, 2, '') AS KeyColumns,
      STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id
        AND ic.is_included_column = 1
        ORDER BY ic.index_column_id
        FOR XML PATH('')
      ), 1, 2, '') AS IncludedColumns,
      (
        SELECT SUM(ps.used_page_count) * 8 / 1024
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
      ) AS SizeMB,
      (
        SELECT SUM(ps.row_count)
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
      ) AS TotalRows
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID('WIPTransactions')
    AND i.name IS NOT NULL
    ORDER BY i.name
  `;

  console.table(wipIndexes.map(idx => ({
    Name: idx.IndexName,
    Type: idx.IndexType,
    Keys: idx.KeyColumns || 'N/A',
    Included: idx.IncludedColumns || 'None',
    Filter: idx.HasFilter ? 'YES' : 'No',
    SizeMB: idx.SizeMB,
    Rows: idx.TotalRows ? Number(idx.TotalRows) : null,
  })));

  console.log('');

  // 2. WIPTransactions - Usage Statistics
  console.log('2. WIPTransactions - Index Usage Statistics');
  console.log('-'.repeat(80));

  const wipUsage = await prisma.$queryRaw<IndexUsage[]>`
    SELECT 
      i.name AS IndexName,
      ISNULL(s.user_seeks, 0) AS UserSeeks,
      ISNULL(s.user_scans, 0) AS UserScans,
      ISNULL(s.user_lookups, 0) AS UserLookups,
      ISNULL(s.user_updates, 0) AS UserUpdates,
      s.last_user_seek AS LastSeek,
      s.last_user_scan AS LastScan
    FROM sys.indexes i
    LEFT JOIN sys.dm_db_index_usage_stats s 
      ON i.object_id = s.object_id 
      AND i.index_id = s.index_id
      AND s.database_id = DB_ID()
    WHERE i.object_id = OBJECT_ID('WIPTransactions')
    AND i.name IS NOT NULL
    ORDER BY ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) DESC
  `;

  console.table(wipUsage.map(idx => ({
    Name: idx.IndexName,
    Seeks: idx.UserSeeks ? Number(idx.UserSeeks) : 0,
    Scans: idx.UserScans ? Number(idx.UserScans) : 0,
    Lookups: idx.UserLookups ? Number(idx.UserLookups) : 0,
    Updates: idx.UserUpdates ? Number(idx.UserUpdates) : 0,
    LastUsed: idx.LastSeek || idx.LastScan || 'Never',
    Status: (Number(idx.UserSeeks || 0) + Number(idx.UserScans || 0) + Number(idx.UserLookups || 0)) === 0 ? '❌ UNUSED' : '✅ Used',
  })));

  console.log('');

  // 3. WIPTransactions - Fragmentation
  console.log('3. WIPTransactions - Index Fragmentation');
  console.log('-'.repeat(80));

  const wipFrag = await prisma.$queryRaw<IndexFragmentation[]>`
    SELECT 
      i.name AS IndexName,
      ips.avg_fragmentation_in_percent AS FragmentationPct,
      ips.page_count AS PageCount,
      ips.page_count * 8 / 1024 AS SizeMB
    FROM sys.dm_db_index_physical_stats(DB_ID(), OBJECT_ID('WIPTransactions'), NULL, NULL, 'SAMPLED') ips
    JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
    WHERE i.name IS NOT NULL
    ORDER BY ips.avg_fragmentation_in_percent DESC
  `;

  console.table(wipFrag.map(idx => ({
    Name: idx.IndexName,
    'Frag%': idx.FragmentationPct.toFixed(2),
    Pages: Number(idx.PageCount),
    SizeMB: Number(idx.SizeMB),
    Status: idx.FragmentationPct > 30 ? '🔴 REBUILD' : idx.FragmentationPct > 10 ? '🟡 REORG' : '🟢 OK',
  })));

  console.log('');
  console.log('='.repeat(80));

  // 4. DrsTransactions - All Indexes
  console.log('4. DrsTransactions - All Indexes');
  console.log('-'.repeat(80));

  const drsIndexes = await prisma.$queryRaw<IndexInfo[]>`
    SELECT 
      i.name AS IndexName,
      i.type_desc AS IndexType,
      i.is_unique AS IsUnique,
      i.has_filter AS HasFilter,
      i.filter_definition AS FilterDef,
      STUFF((
        SELECT ', ' + c.name + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id
        AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
      ), 1, 2, '') AS KeyColumns,
      STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id
        AND ic.is_included_column = 1
        ORDER BY ic.index_column_id
        FOR XML PATH('')
      ), 1, 2, '') AS IncludedColumns,
      (
        SELECT SUM(ps.used_page_count) * 8 / 1024
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
      ) AS SizeMB,
      (
        SELECT SUM(ps.row_count)
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
      ) AS TotalRows
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID('DrsTransactions')
    AND i.name IS NOT NULL
    ORDER BY i.name
  `;

  console.table(drsIndexes.map(idx => ({
    Name: idx.IndexName,
    Type: idx.IndexType,
    Keys: idx.KeyColumns || 'N/A',
    Included: idx.IncludedColumns || 'None',
    Filter: idx.HasFilter ? 'YES' : 'No',
    SizeMB: idx.SizeMB,
    Rows: idx.TotalRows ? Number(idx.TotalRows) : null,
  })));

  console.log('');

  // 5. DrsTransactions - Usage Statistics
  console.log('5. DrsTransactions - Index Usage Statistics');
  console.log('-'.repeat(80));

  const drsUsage = await prisma.$queryRaw<IndexUsage[]>`
    SELECT 
      i.name AS IndexName,
      ISNULL(s.user_seeks, 0) AS UserSeeks,
      ISNULL(s.user_scans, 0) AS UserScans,
      ISNULL(s.user_lookups, 0) AS UserLookups,
      ISNULL(s.user_updates, 0) AS UserUpdates,
      s.last_user_seek AS LastSeek,
      s.last_user_scan AS LastScan
    FROM sys.indexes i
    LEFT JOIN sys.dm_db_index_usage_stats s 
      ON i.object_id = s.object_id 
      AND i.index_id = s.index_id
      AND s.database_id = DB_ID()
    WHERE i.object_id = OBJECT_ID('DrsTransactions')
    AND i.name IS NOT NULL
    ORDER BY ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) DESC
  `;

  console.table(drsUsage.map(idx => ({
    Name: idx.IndexName,
    Seeks: idx.UserSeeks ? Number(idx.UserSeeks) : 0,
    Scans: idx.UserScans ? Number(idx.UserScans) : 0,
    Lookups: idx.UserLookups ? Number(idx.UserLookups) : 0,
    Updates: idx.UserUpdates ? Number(idx.UserUpdates) : 0,
    LastUsed: idx.LastSeek || idx.LastScan || 'Never',
    Status: (Number(idx.UserSeeks || 0) + Number(idx.UserScans || 0) + Number(idx.UserLookups || 0)) === 0 ? '❌ UNUSED' : '✅ Used',
  })));

  console.log('');

  // 6. Summary
  console.log('6. Summary Statistics');
  console.log('-'.repeat(80));

  interface SummaryStats {
    TableName: string;
    TotalIndexes: number;
    FilteredIndexes: number;
    IndexesWithINCLUDE: number;
    TotalIndexSizeMB: number | null;
    TotalRows: bigint | null;
  }

  const summary = await prisma.$queryRaw<SummaryStats[]>`
    SELECT 
      'WIPTransactions' AS TableName,
      COUNT(*) AS TotalIndexes,
      SUM(CASE WHEN i.has_filter = 1 THEN 1 ELSE 0 END) AS FilteredIndexes,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM sys.index_columns ic 
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id 
        AND ic.is_included_column = 1
      ) THEN 1 ELSE 0 END) AS IndexesWithINCLUDE,
      (SELECT SUM(ps.used_page_count) * 8 / 1024 
       FROM sys.dm_db_partition_stats ps 
       WHERE ps.object_id = OBJECT_ID('WIPTransactions')) AS TotalIndexSizeMB,
      (SELECT SUM(ps.row_count) 
       FROM sys.dm_db_partition_stats ps 
       WHERE ps.object_id = OBJECT_ID('WIPTransactions')
       AND ps.index_id IN (0,1)) AS TotalRows
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID('WIPTransactions')
    AND i.name IS NOT NULL

    UNION ALL

    SELECT 
      'DrsTransactions' AS TableName,
      COUNT(*) AS TotalIndexes,
      SUM(CASE WHEN i.has_filter = 1 THEN 1 ELSE 0 END) AS FilteredIndexes,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM sys.index_columns ic 
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id 
        AND ic.is_included_column = 1
      ) THEN 1 ELSE 0 END) AS IndexesWithINCLUDE,
      (SELECT SUM(ps.used_page_count) * 8 / 1024 
       FROM sys.dm_db_partition_stats ps 
       WHERE ps.object_id = OBJECT_ID('DrsTransactions')) AS TotalIndexSizeMB,
      (SELECT SUM(ps.row_count) 
       FROM sys.dm_db_partition_stats ps 
       WHERE ps.object_id = OBJECT_ID('DrsTransactions')
       AND ps.index_id IN (0,1)) AS TotalRows
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID('DrsTransactions')
    AND i.name IS NOT NULL
  `;

  console.table(summary.map(s => ({
    Table: s.TableName,
    'Total Indexes': s.TotalIndexes,
    'Filtered': s.FilteredIndexes,
    'With INCLUDE': s.IndexesWithINCLUDE,
    'Index Size MB': s.TotalIndexSizeMB,
    'Row Count': s.TotalRows ? Number(s.TotalRows).toLocaleString() : 'N/A',
  })));

  console.log('');
  console.log('='.repeat(80));
  console.log('Analysis Complete');
  console.log('='.repeat(80));
  
  await prisma.$disconnect();
}

analyzeIndexes().catch(console.error);
