/**
 * ARCHIVED INLINE SQL IMPLEMENTATION
 * 
 * This file contains the original inline SQL implementation for the Recoverability Report.
 * It was archived on 2026-01-31 when migrating to stored procedure-only implementation.
 * 
 * REASON FOR ARCHIVAL:
 * - Stored procedures (sp_RecoverabilityData and sp_RecoverabilityMonthly) are now the
 *   production implementation, providing better performance and maintainability
 * - This code is preserved for reference and potential rollback if needed
 * 
 * TO RESTORE THIS IMPLEMENTATION:
 * 1. Copy lines 27-447 below (the inline SQL implementation)
 * 2. Paste into route.ts after the stored procedure implementation
 * 3. Re-add the `if (USE_STORED_PROCEDURES)` conditional wrapper
 * 4. Set USE_SP_FOR_REPORTS=false in .env
 * 5. Restart the server
 * 
 * ORIGINAL LOCATION: src/app/api/my-reports/recoverability/route.ts (lines 605-1029)
 * ARCHIVED DATE: 2026-01-31
 */

// ============================================================================
// INLINE SQL IMPLEMENTATION (ARCHIVED)
// ============================================================================

      // 2. Query all DrsTransactions for this biller (LIFETIME TO DATE up to endDate)
      // NOTE: No fiscal year filter - this is cumulative from INCEPTION
      const allTransactions = await prisma.drsTransactions.findMany({
        where: {
          Biller: employee.EmpCode,
          TranDate: { lte: endDate }, // All transactions from beginning of time up to cutoff
        },
        select: {
          TranDate: true,
          Total: true,
          EntryType: true,
          InvNumber: true,
          Reference: true,
          Narration: true,
          ServLineCode: true,
          GSClientID: true,
          ClientCode: true,
          ClientNameFull: true,
          GroupCode: true,
          GroupDesc: true,
        },
        orderBy: [{ ClientCode: 'asc' }, { TranDate: 'asc' }],
      });

      if (allTransactions.length === 0) {
        const emptyReport: RecoverabilityReportData = {
          clients: [],
          totalAging: {
            current: 0,
            days31_60: 0,
            days61_90: 0,
            days91_120: 0,
            days120Plus: 0,
          },
          receiptsComparison: {
            currentPeriodReceipts: 0,
            priorMonthBalance: 0,
            variance: 0,
          },
          employeeCode: employee.EmpCode,
          fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
          fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
          dateRange: mode === 'custom' ? {
            start: format(startDate, 'yyyy-MM-dd'),
            end: format(endDate, 'yyyy-MM-dd'),
          } : undefined,
        };

        // Cache empty result for 5 minutes
        await cache.set(cacheKey, emptyReport, 300);
        return NextResponse.json(successResponse(emptyReport));
      }

      // 3. Get service line mappings
      const uniqueServLineCodes = [...new Set(allTransactions.map(t => t.ServLineCode))];
      const [serviceLines, masterServiceLines] = await Promise.all([
        prisma.serviceLineExternal.findMany({
          where: { ServLineCode: { in: uniqueServLineCodes } },
          select: {
            ServLineCode: true,
            ServLineDesc: true,
            SubServlineGroupCode: true,
            SubServlineGroupDesc: true,
            masterCode: true,
          },
        }),
        prisma.serviceLineMaster.findMany({
          where: { active: true },
          select: { code: true, name: true },
        }),
      ]);

      const servLineDetailsMap = new Map(
        serviceLines.map(sl => [sl.ServLineCode, {
          servLineDesc: sl.ServLineDesc || '',
          subServlineGroupCode: sl.SubServlineGroupCode || '',
          subServlineGroupDesc: sl.SubServlineGroupDesc || '',
          masterCode: sl.masterCode || '',
        }])
      );

      const masterServiceLineMap = new Map(
        masterServiceLines.map(msl => [msl.code, msl.name])
      );

      // 4. Match payments to invoices and calculate balances per client
      const fiscalMonths = mode === 'fiscal' ? getFiscalYearMonths(fiscalYear) : [];
      
      const clientDataMap = new Map<string, {
        clientInfo: {
          GSClientID: string;
          clientCode: string;
          clientNameFull: string | null;
          groupCode: string;
          groupDesc: string;
          servLineCode: string;
        };
        invoices: Map<string, InvoiceData>;
        currentPeriodReceipts: number;
        priorPeriodBalance: number;
        cumulativeBalance: number;  // Running balance from ALL transactions (matches stored procedure BalDrs)
        transactions: { TranDate: Date; Total: number; EntryType: string | null }[];  // Store transactions for monthly calc
      }>();

      // Group transactions by client and invoice
      allTransactions.forEach(txn => {
        const amount = txn.Total || 0;
        const invNumber = txn.InvNumber;
        
        if (!clientDataMap.has(txn.GSClientID)) {
          clientDataMap.set(txn.GSClientID, {
            clientInfo: {
              GSClientID: txn.GSClientID,
              clientCode: txn.ClientCode,
              clientNameFull: txn.ClientNameFull,
              groupCode: txn.GroupCode,
              groupDesc: txn.GroupDesc,
              servLineCode: txn.ServLineCode,
            },
            invoices: new Map(),
            currentPeriodReceipts: 0,
            priorPeriodBalance: 0,
            cumulativeBalance: 0,
            transactions: [],
          });
        }
        
        // Store transaction for monthly calculation (including EntryType)
        clientDataMap.get(txn.GSClientID)!.transactions.push({
          TranDate: txn.TranDate,
          Total: txn.Total || 0,
          EntryType: txn.EntryType,
        });

        const clientData = clientDataMap.get(txn.GSClientID)!;
        
        // Calculate cumulative balance: Total field already has correct sign
        // Invoices = positive (increase balance), Receipts = negative (decrease balance)
        clientData.cumulativeBalance += amount;

        // Track receipts in current period (negative amounts = payments)
        if (txn.TranDate >= startDate && txn.TranDate <= endDate && amount < 0) {
          clientData.currentPeriodReceipts += Math.abs(amount);
        }

        // Track prior period balance (all transactions before start date)
        if (txn.TranDate < startDate) {
          clientData.priorPeriodBalance += amount;
        }

        // Process invoice balances
        if (invNumber) {
          if (!clientData.invoices.has(invNumber)) {
            clientData.invoices.set(invNumber, {
              invoiceNumber: invNumber,
              // For positive amounts (invoices), use transaction date
              // For negative amounts (payments), use endDate temporarily - will update when we see the invoice
              invoiceDate: amount > 0 ? txn.TranDate : endDate,
              originalAmount: amount > 0 ? amount : 0,
              paymentsReceived: 0,
              netBalance: amount,
              daysOutstanding: 0,
              agingBucket: 'current',
            });
          } else {
            const inv = clientData.invoices.get(invNumber)!;
            inv.netBalance += amount;
            
            // Track original amounts and payments
            if (amount > 0) {
              inv.originalAmount += amount;
              
              // ONLY update invoice date for positive transactions (actual invoices)
              if (txn.TranDate < inv.invoiceDate) {
                inv.invoiceDate = txn.TranDate;
              }
            } else {
              inv.paymentsReceived += Math.abs(amount);
            }
          }
        }
      });

      // 5. Calculate aging for each client's invoices
      const clients: ClientDebtorData[] = [];
      const totalAging: AgingBuckets = {
        current: 0,
        days31_60: 0,
        days61_90: 0,
        days91_120: 0,
        days120Plus: 0,
      };

      let totalCurrentPeriodReceipts = 0;
      let totalPriorMonthBalance = 0;

      clientDataMap.forEach((clientData, gsClientId) => {
        const aging: AgingBuckets = {
          current: 0,
          days31_60: 0,
          days61_90: 0,
          days91_120: 0,
          days120Plus: 0,
        };
        
        let totalDaysOutstanding = 0;
        let invoiceCount = 0;
        let totalOpenInvoices = 0;
        let totalNegativeInvoices = 0;
        let invoicesWithoutNumber = 0;
        
        // Identify offsetting invoice pairs (e.g., invoice M0035035 = +138000, reversal BFR0000047 = -138000)
        // Both should be excluded from aging when they offset each other
        const amountMap = new Map<number, string[]>();
        clientData.invoices.forEach((inv, invNumber) => {
          const amount = inv.netBalance;
          if (!amountMap.has(amount)) {
            amountMap.set(amount, []);
          }
          amountMap.get(amount)!.push(invNumber);
        });
        
        const excludedInvoices = new Set<string>();
        amountMap.forEach((invoiceNumbers, amount) => {
          // Check if there's a matching negative amount
          const negativeAmount = -amount;
          if (amount !== 0 && amountMap.has(negativeAmount)) {
            // Both the positive and negative amounts should be excluded
            invoiceNumbers.forEach(inv => excludedInvoices.add(inv));
            amountMap.get(negativeAmount)!.forEach(inv => excludedInvoices.add(inv));
          }
        });

        // Calculate aging buckets from open invoices only (positive balances)
        // Exclude invoices that have offsetting pairs with different invoice numbers
        clientData.invoices.forEach(inv => {
          // Skip if excluded due to matching offsetting pair
          if (excludedInvoices.has(inv.invoiceNumber)) {
            return;
          }
          
          // Age ALL invoices (positive and negative) for aging buckets to reconcile with totalBalance
          // Negative invoices reduce the aging bucket they fall into
          if (inv.netBalance !== 0) {
            // CRITICAL FIX: Use endDate for point-in-time aging (not today)
            const daysDiff = Math.floor((endDate.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysOutstanding = Math.max(0, daysDiff);
            const bucket = getAgingBucket(daysOutstanding);
            
            aging[bucket] += inv.netBalance;
            totalAging[bucket] += inv.netBalance;
            totalDaysOutstanding += daysOutstanding * Math.abs(inv.netBalance);
            invoiceCount++;
            
            if (inv.netBalance > 0) {
              totalOpenInvoices += inv.netBalance;
            } else {
              totalNegativeInvoices += inv.netBalance;
            }
          }
        });

        // Count transactions without invoice numbers
        clientData.transactions.forEach(txn => {
          if (!txn.EntryType || txn.EntryType === '') {
            invoicesWithoutNumber++;
          }
        });

        // Total balance = cumulative balance from ALL transactions (matches Monthly Receipts Closing Balance)
        const totalBalance = clientData.cumulativeBalance;

        // Calculate average days outstanding (weighted by total balance)
        const avgPaymentDaysOutstanding = totalBalance > 0 
          ? totalDaysOutstanding / totalBalance 
          : 0;

        // Get service line details
        const slDetails = servLineDetailsMap.get(clientData.clientInfo.servLineCode);
        const masterCode = slDetails?.masterCode || clientData.clientInfo.servLineCode;
        const masterName = masterServiceLineMap.get(masterCode) || slDetails?.servLineDesc || '';

        // Calculate monthly receipts for this client
        const monthlyReceipts: MonthlyReceiptData[] = fiscalMonths.map(({ monthStart, monthEnd, label, sortKey }) => {
          // Opening balance = sum of all transactions before month start
          // Total field already has correct sign (positive = invoice, negative = receipt)
          let openingBalance = 0;
          clientData.transactions.forEach(txn => {
            if (txn.TranDate < monthStart) {
              openingBalance += txn.Total;
            }
          });
          
          // Receipts = negative transactions within the month (payments)
          let receipts = 0;
          // Billings = positive transactions within the month
          let billings = 0;
          
          clientData.transactions.forEach(txn => {
            if (txn.TranDate >= monthStart && txn.TranDate <= monthEnd) {
              if (txn.Total < 0) {
                receipts += Math.abs(txn.Total);
              } else if (txn.Total > 0) {
                billings += txn.Total;
              }
            }
          });
          
          // Variance = Receipts - Opening Balance (collection surplus/deficit)
          const variance = receipts - openingBalance;
          
          // Recovery percentage
          const recoveryPercent = openingBalance > 0 
            ? (receipts / openingBalance) * 100 
            : 0;
          
          // Closing balance = Opening + Billings - Receipts
          const closingBalance = openingBalance + billings - receipts;
          
          return {
            month: label,
            monthYear: sortKey,
            openingBalance,
            receipts,
            variance,
            recoveryPercent,
            billings,
            closingBalance,
          };
        });

        // Comprehensive filtering: Hide clients with ALL zeros
        // Use small epsilon for floating point comparison
        const EPSILON = 0.01;
        
        // Check if any aging bucket has non-zero values
        const hasNonZeroAging = 
          Math.abs(aging.current) > EPSILON ||
          Math.abs(aging.days31_60) > EPSILON ||
          Math.abs(aging.days61_90) > EPSILON ||
          Math.abs(aging.days91_120) > EPSILON ||
          Math.abs(aging.days120Plus) > EPSILON;

        // Only include clients if they have:
        // 1. Non-zero total balance (final closing balance), OR
        // 2. Non-zero aging buckets (open invoices)
        // NOTE: We don't check historical monthly activity - only final state matters
        if (Math.abs(totalBalance) > EPSILON || hasNonZeroAging) {
          clients.push({
            GSClientID: gsClientId,
            clientCode: clientData.clientInfo.clientCode,
            clientNameFull: clientData.clientInfo.clientNameFull,
            groupCode: clientData.clientInfo.groupCode,
            groupDesc: clientData.clientInfo.groupDesc,
            servLineCode: clientData.clientInfo.servLineCode,
            serviceLineName: slDetails?.servLineDesc || '',
            masterServiceLineCode: masterCode,
            masterServiceLineName: masterName,
            subServlineGroupCode: slDetails?.subServlineGroupCode || '',
            subServlineGroupDesc: slDetails?.subServlineGroupDesc || '',
            totalBalance,
            aging,
            currentPeriodReceipts: clientData.currentPeriodReceipts,
            priorMonthBalance: clientData.priorPeriodBalance,
            invoiceCount,
            avgPaymentDaysOutstanding,
            avgPaymentDaysPaid: null, // Only available via DrsLTDv2 stored procedure
            monthlyReceipts,
          });
        }

        totalCurrentPeriodReceipts += clientData.currentPeriodReceipts;
        totalPriorMonthBalance += clientData.priorPeriodBalance;
      });

      // Sort clients by group then client code
      clients.sort((a, b) => {
        const groupCompare = a.groupDesc.localeCompare(b.groupDesc);
        if (groupCompare !== 0) return groupCompare;
        return a.clientCode.localeCompare(b.clientCode);
      });

      const report: RecoverabilityReportData = {
        clients,
        totalAging,
        receiptsComparison: {
          currentPeriodReceipts: totalCurrentPeriodReceipts,
          priorMonthBalance: totalPriorMonthBalance,
          variance: totalPriorMonthBalance - totalCurrentPeriodReceipts,
        },
        employeeCode: employee.EmpCode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
        dateRange: mode === 'custom' ? {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        } : undefined,
      };

      // Cache - use longer TTL for past fiscal years (more stable data)
      const cacheTTL = mode === 'fiscal' && fiscalYear < currentFY ? 1800 : 600;
      await cache.set(cacheKey, report, cacheTTL);

      // Background cache past fiscal years (non-blocking)
      if (mode === 'fiscal' && fiscalYear === currentFY) {
        cachePastFiscalYearsInBackground(user.id, currentFY);
      }

      const duration = Date.now() - startTime;
      logger.info('Recoverability report generated', {
        userId: user.id,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: fiscalMonthParam,
        clientCount: clients.length,
        duration,
      });

      return NextResponse.json(successResponse(report));
