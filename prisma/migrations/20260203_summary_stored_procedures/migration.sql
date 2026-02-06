-- ============================================================================
-- Summary Stored Procedures for Country Management Performance Reports
-- Created: 2026-02-03
-- ============================================================================
-- These procedures return pre-aggregated data for executive dashboards
-- instead of task-level detail, reducing response time from 60s+ to 2-5s.
-- ============================================================================

-- ============================================================================
-- sp_ProfitabilitySummaryByPartner (v1.0)
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ProfitabilitySummaryByPartner] 
     @ServLineCode nvarchar(max)  = '*'
    ,@PartnerCode nvarchar(max)   = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2025/01/01'
AS

SET NOCOUNT ON

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

CREATE TABLE #WIPAggregates (
    GSTaskID UNIQUEIDENTIFIER
    ,TaskPartner NVARCHAR(10)
    ,OpeningT FLOAT
    ,OpeningD FLOAT
    ,OpeningADJ FLOAT
    ,OpeningF FLOAT
    ,OpeningP FLOAT
    ,LTDTimeCharged FLOAT
    ,LTDDisbCharged FLOAT
    ,LTDFeesBilled FLOAT
    ,LTDAdjustments FLOAT
    ,LTDWipProvision FLOAT
    ,LTDHours FLOAT
    ,LTDCost FLOAT
)

SET @sql = N'
INSERT INTO #WIPAggregates
SELECT 
    w.GSTaskID
    ,w.TaskPartner
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningT
    ,SUM(CASE WHEN w.TType = ''D'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningD
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningADJ
    ,SUM(CASE WHEN w.TType = ''F'' AND w.TranDate < @p_DateFrom THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningF
    ,SUM(CASE WHEN w.TType = ''P'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningP
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged
    ,SUM(CASE WHEN w.TType = ''D'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged
    ,SUM(CASE WHEN w.TType = ''F'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments
    ,SUM(CASE WHEN w.TType = ''P'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Hour, 0) ELSE 0 END) AS LTDHours
    ,SUM(CASE WHEN w.TType != ''P'' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != ''CARL'') 
              AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE 1=1'

IF @PartnerCode != '*' AND CHARINDEX(',', @PartnerCode) > 0
    SET @sql = @sql + N' AND w.TaskPartner IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_PartnerCode, '',''))'
ELSE IF @PartnerCode != '*'
    SET @sql = @sql + N' AND w.TaskPartner = @p_PartnerCode'

IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID, w.TaskPartner
OPTION (RECOMPILE)'

SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, @p_PartnerCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo,
    @p_PartnerCode = @PartnerCode,
    @p_ServLineCode = @ServLineCode

CREATE CLUSTERED INDEX IX_WIPAgg_TaskPartner ON #WIPAggregates (TaskPartner, GSTaskID)

CREATE TABLE #PartnerInfo (
    TaskPartner NVARCHAR(10)
    ,PartnerName NVARCHAR(100)
)

INSERT INTO #PartnerInfo
SELECT DISTINCT 
    wa.TaskPartner
    ,ISNULL(e.EmpName, wa.TaskPartner) AS PartnerName
FROM #WIPAggregates wa
LEFT JOIN [dbo].[Employee] e ON wa.TaskPartner = e.EmpCode
WHERE wa.TaskPartner IS NOT NULL AND wa.TaskPartner != ''

CREATE CLUSTERED INDEX IX_PI_TaskPartner ON #PartnerInfo (TaskPartner)

CREATE TABLE #PartnerClients (
    TaskPartner NVARCHAR(10)
    ,ClientCount INT
)

INSERT INTO #PartnerClients
SELECT 
    wa.TaskPartner
    ,COUNT(DISTINCT t.GSClientID) AS ClientCount
FROM #WIPAggregates wa
INNER JOIN [dbo].[Task] t ON wa.GSTaskID = t.GSTaskID
WHERE wa.TaskPartner IS NOT NULL AND wa.TaskPartner != ''
GROUP BY wa.TaskPartner

CREATE CLUSTERED INDEX IX_PC_TaskPartner ON #PartnerClients (TaskPartner)

SELECT 
    pi.TaskPartner AS PartnerCode
    ,pi.PartnerName
    ,COUNT(DISTINCT wa.GSTaskID) AS TaskCount
    ,ISNULL(pc.ClientCount, 0) AS ClientCount
    ,ROUND(SUM(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP), 2) AS OpeningBalance
    ,ROUND(SUM(wa.LTDTimeCharged), 2) AS LTDTimeCharged
    ,ROUND(SUM(wa.LTDDisbCharged), 2) AS LTDDisbCharged
    ,ROUND(SUM(wa.LTDFeesBilled), 2) AS LTDFeesBilled
    ,ROUND(SUM(wa.LTDAdjustments + wa.LTDWipProvision), 2) AS LTDAdjustments
    ,ROUND(SUM(wa.LTDHours), 2) AS LTDHours
    ,ROUND(SUM(wa.LTDCost), 2) AS LTDCost
    ,ROUND(SUM(
        wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
        + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
    ), 2) AS BalWip
    ,ROUND(SUM(
        wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
        + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
        + wa.OpeningP + wa.LTDWipProvision
    ), 2) AS NetWIP
    ,ROUND(SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision), 2) AS NetRevenue
    ,ROUND(SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost), 2) AS GrossProfit
    ,CASE 
        WHEN SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) = 0 THEN 0
        ELSE ROUND(
            SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost) 
            / SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) * 100
        , 2)
    END AS GPPercentage
FROM #WIPAggregates wa
INNER JOIN #PartnerInfo pi ON wa.TaskPartner = pi.TaskPartner
LEFT JOIN #PartnerClients pc ON wa.TaskPartner = pc.TaskPartner
WHERE 
    ABS(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP) > 0.01
    OR ABS(wa.LTDTimeCharged) > 0.01
    OR ABS(wa.LTDDisbCharged) > 0.01
    OR ABS(wa.LTDAdjustments) > 0.01
    OR ABS(wa.LTDFeesBilled) > 0.01
    OR ABS(wa.LTDWipProvision) > 0.01
GROUP BY pi.TaskPartner, pi.PartnerName, pc.ClientCount
ORDER BY pi.PartnerName

DROP TABLE #WIPAggregates
DROP TABLE #PartnerInfo
DROP TABLE #PartnerClients

GO

-- ============================================================================
-- sp_ProfitabilitySummaryByManager (v1.0)
-- ============================================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_ProfitabilitySummaryByManager] 
     @ServLineCode nvarchar(max)  = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2025/01/01'
AS

SET NOCOUNT ON

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

CREATE TABLE #WIPAggregates (
    GSTaskID UNIQUEIDENTIFIER
    ,TaskManager NVARCHAR(10)
    ,OpeningT FLOAT
    ,OpeningD FLOAT
    ,OpeningADJ FLOAT
    ,OpeningF FLOAT
    ,OpeningP FLOAT
    ,LTDTimeCharged FLOAT
    ,LTDDisbCharged FLOAT
    ,LTDFeesBilled FLOAT
    ,LTDAdjustments FLOAT
    ,LTDWipProvision FLOAT
    ,LTDHours FLOAT
    ,LTDCost FLOAT
)

SET @sql = N'
INSERT INTO #WIPAggregates
SELECT 
    w.GSTaskID
    ,w.TaskManager
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningT
    ,SUM(CASE WHEN w.TType = ''D'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningD
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningADJ
    ,SUM(CASE WHEN w.TType = ''F'' AND w.TranDate < @p_DateFrom THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningF
    ,SUM(CASE WHEN w.TType = ''P'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningP
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged
    ,SUM(CASE WHEN w.TType = ''D'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged
    ,SUM(CASE WHEN w.TType = ''F'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments
    ,SUM(CASE WHEN w.TType = ''P'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Hour, 0) ELSE 0 END) AS LTDHours
    ,SUM(CASE WHEN w.TType != ''P'' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != ''CARL'') 
              AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE 1=1'

IF @ManagerCode != '*' AND CHARINDEX(',', @ManagerCode) > 0
    SET @sql = @sql + N' AND w.TaskManager IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ManagerCode, '',''))'
ELSE IF @ManagerCode != '*'
    SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID, w.TaskManager
OPTION (RECOMPILE)'

SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode

CREATE CLUSTERED INDEX IX_WIPAgg_TaskManager ON #WIPAggregates (TaskManager, GSTaskID)

CREATE TABLE #ManagerInfo (
    TaskManager NVARCHAR(10)
    ,ManagerName NVARCHAR(100)
)

INSERT INTO #ManagerInfo
SELECT DISTINCT 
    wa.TaskManager
    ,ISNULL(e.EmpName, wa.TaskManager) AS ManagerName
FROM #WIPAggregates wa
LEFT JOIN [dbo].[Employee] e ON wa.TaskManager = e.EmpCode
WHERE wa.TaskManager IS NOT NULL AND wa.TaskManager != ''

CREATE CLUSTERED INDEX IX_MI_TaskManager ON #ManagerInfo (TaskManager)

CREATE TABLE #ManagerClients (
    TaskManager NVARCHAR(10)
    ,ClientCount INT
)

INSERT INTO #ManagerClients
SELECT 
    wa.TaskManager
    ,COUNT(DISTINCT t.GSClientID) AS ClientCount
FROM #WIPAggregates wa
INNER JOIN [dbo].[Task] t ON wa.GSTaskID = t.GSTaskID
WHERE wa.TaskManager IS NOT NULL AND wa.TaskManager != ''
GROUP BY wa.TaskManager

CREATE CLUSTERED INDEX IX_MC_TaskManager ON #ManagerClients (TaskManager)

SELECT 
    mi.TaskManager AS ManagerCode
    ,mi.ManagerName
    ,COUNT(DISTINCT wa.GSTaskID) AS TaskCount
    ,ISNULL(mc.ClientCount, 0) AS ClientCount
    ,ROUND(SUM(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP), 2) AS OpeningBalance
    ,ROUND(SUM(wa.LTDTimeCharged), 2) AS LTDTimeCharged
    ,ROUND(SUM(wa.LTDDisbCharged), 2) AS LTDDisbCharged
    ,ROUND(SUM(wa.LTDFeesBilled), 2) AS LTDFeesBilled
    ,ROUND(SUM(wa.LTDAdjustments + wa.LTDWipProvision), 2) AS LTDAdjustments
    ,ROUND(SUM(wa.LTDHours), 2) AS LTDHours
    ,ROUND(SUM(wa.LTDCost), 2) AS LTDCost
    ,ROUND(SUM(
        wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
        + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
    ), 2) AS BalWip
    ,ROUND(SUM(
        wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
        + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
        + wa.OpeningP + wa.LTDWipProvision
    ), 2) AS NetWIP
    ,ROUND(SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision), 2) AS NetRevenue
    ,ROUND(SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost), 2) AS GrossProfit
    ,CASE 
        WHEN SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) = 0 THEN 0
        ELSE ROUND(
            SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost) 
            / SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) * 100
        , 2)
    END AS GPPercentage
FROM #WIPAggregates wa
INNER JOIN #ManagerInfo mi ON wa.TaskManager = mi.TaskManager
LEFT JOIN #ManagerClients mc ON wa.TaskManager = mc.TaskManager
WHERE 
    ABS(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP) > 0.01
    OR ABS(wa.LTDTimeCharged) > 0.01
    OR ABS(wa.LTDDisbCharged) > 0.01
    OR ABS(wa.LTDAdjustments) > 0.01
    OR ABS(wa.LTDFeesBilled) > 0.01
    OR ABS(wa.LTDWipProvision) > 0.01
GROUP BY mi.TaskManager, mi.ManagerName, mc.ClientCount
ORDER BY mi.ManagerName

DROP TABLE #WIPAggregates
DROP TABLE #ManagerInfo
DROP TABLE #ManagerClients

GO

-- ============================================================================
-- sp_WIPAgingSummaryByPartner (v1.0)
-- ============================================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_WIPAgingSummaryByPartner] 
     @ServLineCode nvarchar(max)  = '*'
    ,@PartnerCode nvarchar(max)   = '*'
    ,@AsOfDate datetime           = NULL
AS

SET NOCOUNT ON

SET @AsOfDate = ISNULL(@AsOfDate, GETDATE())

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

CREATE TABLE #TaskAging (
    GSTaskID UNIQUEIDENTIFIER
    ,TaskPartner NVARCHAR(10)
    ,Curr FLOAT
    ,Bal30 FLOAT
    ,Bal60 FLOAT
    ,Bal90 FLOAT
    ,Bal120 FLOAT
    ,Bal150 FLOAT
    ,Bal180 FLOAT
    ,GrossWIP FLOAT
    ,TotalCredits FLOAT
    ,TotalProvision FLOAT
)

SET @sql = N'
INSERT INTO #TaskAging
SELECT 
    w.GSTaskID
    ,w.TaskPartner
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 30 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Curr
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 30 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 60 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal30
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 60 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 90 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal60
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 90 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 120 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal90
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 120 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 150 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal120
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 150 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 180 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal150
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 180 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal180
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') THEN ISNULL(w.Amount, 0) ELSE 0 END) AS GrossWIP
    ,SUM(CASE WHEN w.TType = ''F'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TotalCredits
    ,SUM(CASE WHEN w.TType = ''P'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TotalProvision
FROM [dbo].[WIPTransactions] w
WHERE w.TranDate <= @p_AsOfDate'

IF @PartnerCode != '*' AND CHARINDEX(',', @PartnerCode) > 0
    SET @sql = @sql + N' AND w.TaskPartner IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_PartnerCode, '',''))'
ELSE IF @PartnerCode != '*'
    SET @sql = @sql + N' AND w.TaskPartner = @p_PartnerCode'

IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID, w.TaskPartner
OPTION (RECOMPILE)'

SET @params = N'@p_AsOfDate datetime, @p_PartnerCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_AsOfDate = @AsOfDate,
    @p_PartnerCode = @PartnerCode,
    @p_ServLineCode = @ServLineCode

CREATE CLUSTERED INDEX IX_TA_TaskPartner ON #TaskAging (TaskPartner, GSTaskID)

CREATE TABLE #PartnerInfo (
    TaskPartner NVARCHAR(10)
    ,PartnerName NVARCHAR(100)
)

INSERT INTO #PartnerInfo
SELECT DISTINCT 
    ta.TaskPartner
    ,ISNULL(e.EmpName, ta.TaskPartner) AS PartnerName
FROM #TaskAging ta
LEFT JOIN [dbo].[Employee] e ON ta.TaskPartner = e.EmpCode
WHERE ta.TaskPartner IS NOT NULL AND ta.TaskPartner != ''

CREATE CLUSTERED INDEX IX_PI_TaskPartner ON #PartnerInfo (TaskPartner)

CREATE TABLE #PartnerClients (
    TaskPartner NVARCHAR(10)
    ,ClientCount INT
)

INSERT INTO #PartnerClients
SELECT 
    ta.TaskPartner
    ,COUNT(DISTINCT t.GSClientID) AS ClientCount
FROM #TaskAging ta
INNER JOIN [dbo].[Task] t ON ta.GSTaskID = t.GSTaskID
WHERE ta.TaskPartner IS NOT NULL AND ta.TaskPartner != ''
GROUP BY ta.TaskPartner

CREATE CLUSTERED INDEX IX_PC_TaskPartner ON #PartnerClients (TaskPartner)

SELECT 
    pi.TaskPartner AS PartnerCode
    ,pi.PartnerName
    ,COUNT(DISTINCT ta.GSTaskID) AS TaskCount
    ,ISNULL(pc.ClientCount, 0) AS ClientCount
    ,ROUND(SUM(ta.Curr), 2) AS Curr
    ,ROUND(SUM(ta.Bal30), 2) AS Bal30
    ,ROUND(SUM(ta.Bal60), 2) AS Bal60
    ,ROUND(SUM(ta.Bal90), 2) AS Bal90
    ,ROUND(SUM(ta.Bal120), 2) AS Bal120
    ,ROUND(SUM(ta.Bal150), 2) AS Bal150
    ,ROUND(SUM(ta.Bal180), 2) AS Bal180
    ,ROUND(SUM(ta.GrossWIP), 2) AS GrossWIP
    ,ROUND(SUM(ta.GrossWIP - ta.TotalCredits), 2) AS BalWIP
    ,ROUND(SUM(ta.GrossWIP - ta.TotalCredits + ta.TotalProvision), 2) AS NettWIP
    ,ROUND(SUM(ta.TotalProvision), 2) AS TotalProvision
FROM #TaskAging ta
INNER JOIN #PartnerInfo pi ON ta.TaskPartner = pi.TaskPartner
LEFT JOIN #PartnerClients pc ON ta.TaskPartner = pc.TaskPartner
WHERE 
    ABS(ta.GrossWIP - ta.TotalCredits) > 0.01
    OR ABS(ta.TotalProvision) > 0.01
GROUP BY pi.TaskPartner, pi.PartnerName, pc.ClientCount
ORDER BY pi.PartnerName

DROP TABLE #TaskAging
DROP TABLE #PartnerInfo
DROP TABLE #PartnerClients

GO

-- ============================================================================
-- sp_WIPAgingSummaryByManager (v1.0)
-- ============================================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_WIPAgingSummaryByManager] 
     @ServLineCode nvarchar(max)  = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@AsOfDate datetime           = NULL
AS

SET NOCOUNT ON

SET @AsOfDate = ISNULL(@AsOfDate, GETDATE())

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

CREATE TABLE #TaskAging (
    GSTaskID UNIQUEIDENTIFIER
    ,TaskManager NVARCHAR(10)
    ,Curr FLOAT
    ,Bal30 FLOAT
    ,Bal60 FLOAT
    ,Bal90 FLOAT
    ,Bal120 FLOAT
    ,Bal150 FLOAT
    ,Bal180 FLOAT
    ,GrossWIP FLOAT
    ,TotalCredits FLOAT
    ,TotalProvision FLOAT
)

SET @sql = N'
INSERT INTO #TaskAging
SELECT 
    w.GSTaskID
    ,w.TaskManager
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 30 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Curr
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 30 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 60 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal30
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 60 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 90 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal60
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 90 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 120 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal90
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 120 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 150 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal120
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 150 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 180 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal150
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 180 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal180
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') THEN ISNULL(w.Amount, 0) ELSE 0 END) AS GrossWIP
    ,SUM(CASE WHEN w.TType = ''F'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TotalCredits
    ,SUM(CASE WHEN w.TType = ''P'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TotalProvision
FROM [dbo].[WIPTransactions] w
WHERE w.TranDate <= @p_AsOfDate'

IF @ManagerCode != '*' AND CHARINDEX(',', @ManagerCode) > 0
    SET @sql = @sql + N' AND w.TaskManager IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ManagerCode, '',''))'
ELSE IF @ManagerCode != '*'
    SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID, w.TaskManager
OPTION (RECOMPILE)'

SET @params = N'@p_AsOfDate datetime, @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_AsOfDate = @AsOfDate,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode

CREATE CLUSTERED INDEX IX_TA_TaskManager ON #TaskAging (TaskManager, GSTaskID)

CREATE TABLE #ManagerInfo (
    TaskManager NVARCHAR(10)
    ,ManagerName NVARCHAR(100)
)

INSERT INTO #ManagerInfo
SELECT DISTINCT 
    ta.TaskManager
    ,ISNULL(e.EmpName, ta.TaskManager) AS ManagerName
FROM #TaskAging ta
LEFT JOIN [dbo].[Employee] e ON ta.TaskManager = e.EmpCode
WHERE ta.TaskManager IS NOT NULL AND ta.TaskManager != ''

CREATE CLUSTERED INDEX IX_MI_TaskManager ON #ManagerInfo (TaskManager)

CREATE TABLE #ManagerClients (
    TaskManager NVARCHAR(10)
    ,ClientCount INT
)

INSERT INTO #ManagerClients
SELECT 
    ta.TaskManager
    ,COUNT(DISTINCT t.GSClientID) AS ClientCount
FROM #TaskAging ta
INNER JOIN [dbo].[Task] t ON ta.GSTaskID = t.GSTaskID
WHERE ta.TaskManager IS NOT NULL AND ta.TaskManager != ''
GROUP BY ta.TaskManager

CREATE CLUSTERED INDEX IX_MC_TaskManager ON #ManagerClients (TaskManager)

SELECT 
    mi.TaskManager AS ManagerCode
    ,mi.ManagerName
    ,COUNT(DISTINCT ta.GSTaskID) AS TaskCount
    ,ISNULL(mc.ClientCount, 0) AS ClientCount
    ,ROUND(SUM(ta.Curr), 2) AS Curr
    ,ROUND(SUM(ta.Bal30), 2) AS Bal30
    ,ROUND(SUM(ta.Bal60), 2) AS Bal60
    ,ROUND(SUM(ta.Bal90), 2) AS Bal90
    ,ROUND(SUM(ta.Bal120), 2) AS Bal120
    ,ROUND(SUM(ta.Bal150), 2) AS Bal150
    ,ROUND(SUM(ta.Bal180), 2) AS Bal180
    ,ROUND(SUM(ta.GrossWIP), 2) AS GrossWIP
    ,ROUND(SUM(ta.GrossWIP - ta.TotalCredits), 2) AS BalWIP
    ,ROUND(SUM(ta.GrossWIP - ta.TotalCredits + ta.TotalProvision), 2) AS NettWIP
    ,ROUND(SUM(ta.TotalProvision), 2) AS TotalProvision
FROM #TaskAging ta
INNER JOIN #ManagerInfo mi ON ta.TaskManager = mi.TaskManager
LEFT JOIN #ManagerClients mc ON ta.TaskManager = mc.TaskManager
WHERE 
    ABS(ta.GrossWIP - ta.TotalCredits) > 0.01
    OR ABS(ta.TotalProvision) > 0.01
GROUP BY mi.TaskManager, mi.ManagerName, mc.ClientCount
ORDER BY mi.ManagerName

DROP TABLE #TaskAging
DROP TABLE #ManagerInfo
DROP TABLE #ManagerClients

GO
