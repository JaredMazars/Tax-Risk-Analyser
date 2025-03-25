'use client';

import { useState, useCallback, useEffect } from 'react';
import { mappingGuide } from '@/lib/mappingGuide';
import { formatAmount } from '@/lib/formatters';
import { MappedData } from '@/types';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface BalanceSheetSectionProps {
  title: string;
  items: Array<{
    sarsItem: string;
    subsection: string;
    amount: number;
    mappedAccounts: Array<{
      id: number;
      accountCode: string;
      accountName: string;
      subsection: string;
      balance: number;
      section: string;
      sarsItem: string;
    }>;
  }>;
  mappedData: MappedData[];
  projectId: string;
  onMappingUpdate: (accountId: number, newSarsItem: string) => Promise<void>;
}

function BalanceSheetSection({ title, items, mappedData, projectId, onMappingUpdate }: BalanceSheetSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const isNegative = totalAmount < 0;

  return (
    <div className="space-y-2">
      {/* Main section row */}
      <div 
        className={`grid grid-cols-12 gap-4 cursor-pointer hover:bg-gray-50 ${isUpdating ? 'opacity-50' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`col-span-8 pl-4 ${isNegative ? 'text-red-600' : ''} flex items-center font-medium`}>
          <ChevronRightIcon 
            className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          {title}
          {isUpdating && (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        <div className={`col-span-4 text-right tabular-nums ${isNegative ? 'text-red-600' : ''}`}>
          {isNegative 
            ? `(${formatAmount(Math.abs(totalAmount))})` 
            : formatAmount(Math.abs(totalAmount))}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="ml-6">
              <div className="grid grid-cols-12 gap-4 hover:bg-gray-50">
                <div className={`col-span-8 pl-4 ${item.amount < 0 ? 'text-red-600' : ''} flex items-center`}>
                  <ChevronRightIcon 
                    className={`h-4 w-4 mr-2 opacity-0`}
                  />
                  <div>
                    <div>{item.sarsItem}</div>
                    <div className="text-sm text-gray-500 italic">{item.subsection}</div>
                  </div>
                </div>
                <div className={`col-span-4 text-right tabular-nums ${item.amount < 0 ? 'text-red-600' : ''}`}>
                  {item.amount < 0 
                    ? `(${formatAmount(Math.abs(item.amount))})` 
                    : formatAmount(Math.abs(item.amount))}
                </div>
              </div>
              
              {/* Mapped accounts */}
              {mappedData && (
                <div className="ml-8 mt-1 mb-2">
                  {mappedData
                    .filter(account => account.sarsItem === item.sarsItem && account.balance !== 0)
                    .map((account) => (
                      <div key={account.id} className="grid grid-cols-12 gap-4 text-sm items-center py-1">
                        <div className="col-span-2 text-gray-600">{account.accountCode}</div>
                        <div className="col-span-3 text-gray-800 truncate">{account.accountName}</div>
                        <div className="col-span-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium truncate
                            ${account.section.toLowerCase() === 'balance sheet' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {account.section}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <button
                            onClick={() => onMappingUpdate(account.id, account.sarsItem)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit Mapping
                          </button>
                        </div>
                        <div className={`col-span-3 text-right tabular-nums ${account.balance < 0 ? 'text-red-600' : ''}`}>
                          {account.balance < 0 
                            ? `(${formatAmount(Math.abs(account.balance))})` 
                            : formatAmount(account.balance)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BalanceSheetPage({ params }: { params: { id: string } }) {
  const [mappedData, setMappedData] = useState<MappedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  // Fetch project name
  useEffect(() => {
    async function fetchProjectName() {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project details');
        }
        const data = await response.json();
        setProjectName(data.name);
      } catch (err) {
        console.error('Error fetching project name:', err);
        setProjectName('Project'); // Fallback name
      }
    }

    fetchProjectName();
  }, [params.id]);

  // Fetch mapped data
  useEffect(() => {
    async function fetchMappedData() {
      try {
        const response = await fetch(`/api/projects/${params.id}/mapped-accounts`);
        if (!response.ok) {
          throw new Error('Failed to fetch mapped data');
        }
        const data = await response.json();
        setMappedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMappedData();
  }, [params.id]);

  const handleMappingUpdate = async (accountId: number, newSarsItem: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/mapped-accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sarsItem: newSarsItem }),
      });

      if (!response.ok) {
        throw new Error('Failed to update mapping');
      }

      // Refresh data
      const updatedData = await fetch(`/api/projects/${params.id}/mapped-accounts`).then(res => res.json());
      setMappedData(updatedData);
    } catch (error) {
      console.error('Error updating mapping:', error);
      throw error;
    }
  };

  function calculateNestedTotal(obj: Record<string, any>): number {
    return Object.values(obj).reduce((sum, val) => {
      if (typeof val === 'number') {
        return sum + val;
      }
      if (typeof val === 'object' && val !== null) {
        return sum + calculateNestedTotal(val);
      }
      return sum;
    }, 0);
  }

  function transformMappedDataToBalanceSheet(mappedData: MappedData[]) {
    // Initialize balance sheet structure
    const balanceSheet = {
      nonCurrentAssets: {} as Record<string, { amount: number; subsection: string; mappedAccounts: MappedData[] }>,
      currentAssets: {} as Record<string, { amount: number; subsection: string; mappedAccounts: MappedData[] }>,
      capitalAndReserves: {} as Record<string, { amount: number; subsection: string; mappedAccounts: MappedData[] }>,
      debitBalances: {} as Record<string, { amount: number; subsection: string; mappedAccounts: MappedData[] }>,
      nonCurrentLiabilities: {} as Record<string, { amount: number; subsection: string; mappedAccounts: MappedData[] }>,
      currentLiabilities: {} as Record<string, { amount: number; subsection: string; mappedAccounts: MappedData[] }>,
    };

    // First, aggregate balances for the same SARS items
    const aggregatedBalances = mappedData.reduce((acc, item) => {
      // Only process Balance Sheet items
      if (item.section.toLowerCase() !== 'balance sheet') return acc;
      
      const key = item.sarsItem;
      if (!acc[key]) {
        acc[key] = {
          sarsItem: key,
          subsection: item.subsection,
          amount: 0,
          mappedAccounts: []
        };
      }

      acc[key].amount += item.balance;
      acc[key].mappedAccounts.push(item);
      return acc;
    }, {} as Record<string, { sarsItem: string; subsection: string; amount: number; mappedAccounts: MappedData[] }>);

    // Distribute items to their respective sections based on database subsection
    Object.values(aggregatedBalances).forEach(item => {
      const { sarsItem, subsection, amount, mappedAccounts } = item;
      const data = { amount, subsection, mappedAccounts };

      switch (subsection.toLowerCase()) {
        case 'noncurrentassets':
          balanceSheet.nonCurrentAssets[sarsItem] = data;
          break;
        case 'currentassets':
          balanceSheet.currentAssets[sarsItem] = data;
          break;
        case 'capitalandreserves':
          if (amount < 0) {
            balanceSheet.capitalAndReserves[sarsItem] = data;
          } else {
            balanceSheet.debitBalances[sarsItem] = { ...data, amount: -amount };
          }
          break;
        case 'noncurrentliabilities':
          balanceSheet.nonCurrentLiabilities[sarsItem] = { ...data, amount: Math.abs(amount) };
          break;
        case 'currentliabilities':
          balanceSheet.currentLiabilities[sarsItem] = { ...data, amount: Math.abs(amount) };
          break;
        default:
          console.warn(`Unknown subsection: ${subsection} for SARS item: ${sarsItem}`);
          balanceSheet.currentAssets[sarsItem] = data;
      }
    });

    return balanceSheet;
  }

  // Calculate totals
  const calculateTotals = () => {
    if (!mappedData) return { balanceSheet: 0, incomeStatement: 0 };
    
    return mappedData.reduce((acc, item) => {
      const isBalanceSheet = item.section.toLowerCase() === 'balance sheet';
      const isIncomeStatement = item.section.toLowerCase() === 'income statement';
      
      if (isBalanceSheet) {
        acc.balanceSheet += item.balance;
      } else if (isIncomeStatement) {
        acc.incomeStatement += item.balance;
      }
      return acc;
    }, { balanceSheet: 0, incomeStatement: 0 });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm text-red-600">{error}</p>
    </div>;
  }

  if (mappedData.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No mapped data available. Upload a trial balance to get started.
      </div>
    );
  }

  const balanceSheet = transformMappedDataToBalanceSheet(mappedData);
  const totals = calculateTotals();
  
  // Helper function to get mapped accounts for a SARS item
  const getMappedAccounts = (sarsItem: string) => {
    return mappedData.filter(item => item.sarsItem === sarsItem && item.balance !== 0);
  };

  // Calculate totals with proper sign handling
  const totalAssets = calculateNestedTotal(balanceSheet.nonCurrentAssets) + calculateNestedTotal(balanceSheet.currentAssets);
  const currentYearProfitLoss = totals.incomeStatement;
  const totalEquity = -calculateNestedTotal(balanceSheet.capitalAndReserves) - calculateNestedTotal(balanceSheet.debitBalances) + currentYearProfitLoss;
  const totalLiabilities = calculateNestedTotal(balanceSheet.nonCurrentLiabilities) + calculateNestedTotal(balanceSheet.currentLiabilities);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">{projectName}</h2>
        <p className="text-sm text-gray-500">Balance Sheet</p>
        <p className="text-sm text-gray-500">As at {new Date().toLocaleDateString('en-ZA')}</p>
      </div>

      <div className="space-y-6">
        {/* Non Current Assets */}
        <BalanceSheetSection
          title="Non Current Assets"
          items={Object.entries(balanceSheet.nonCurrentAssets).map(([sarsItem, data]) => ({
            sarsItem,
            amount: data.amount,
            subsection: data.subsection,
            mappedAccounts: data.mappedAccounts,
          }))}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Current Assets */}
        <BalanceSheetSection
          title="Current Assets"
          items={Object.entries(balanceSheet.currentAssets).map(([sarsItem, data]) => ({
            sarsItem,
            amount: data.amount,
            subsection: data.subsection,
            mappedAccounts: data.mappedAccounts,
          }))}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Total Assets */}
        <div className="grid grid-cols-12 gap-4 font-bold border-t border-b border-gray-300 py-2">
          <div className="col-span-8">TOTAL ASSETS</div>
          <div className="col-span-4 text-right tabular-nums">
            {formatAmount(totalAssets)}
          </div>
        </div>

        {/* Capital and Reserves */}
        <BalanceSheetSection
          title="Capital and Reserves"
          items={Object.entries(balanceSheet.capitalAndReserves).map(([sarsItem, data]) => ({
            sarsItem,
            amount: data.amount,
            subsection: data.subsection,
            mappedAccounts: data.mappedAccounts,
          }))}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Non-Current Liabilities */}
        <BalanceSheetSection
          title="Non-Current Liabilities"
          items={Object.entries(balanceSheet.nonCurrentLiabilities).map(([sarsItem, data]) => ({
            sarsItem,
            amount: data.amount,
            subsection: data.subsection,
            mappedAccounts: data.mappedAccounts,
          }))}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Current Liabilities */}
        <BalanceSheetSection
          title="Current Liabilities"
          items={Object.entries(balanceSheet.currentLiabilities).map(([sarsItem, data]) => ({
            sarsItem,
            amount: data.amount,
            subsection: data.subsection,
            mappedAccounts: data.mappedAccounts,
          }))}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Total Equity and Liabilities */}
        <div className="grid grid-cols-12 gap-4 font-bold border-t border-b border-gray-300 py-2">
          <div className="col-span-8">TOTAL EQUITY AND LIABILITIES</div>
          <div className="col-span-4 text-right tabular-nums">
            {formatAmount(- totalEquity + totalLiabilities)}
          </div>
        </div>
      </div>
    </div>
  );
} 