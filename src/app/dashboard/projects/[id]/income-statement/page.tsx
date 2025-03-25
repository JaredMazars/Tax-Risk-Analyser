'use client';

import { useState, useEffect } from 'react';
import { mappingGuide } from '@/lib/mappingGuide';
import { formatAmount } from '@/lib/formatters';
import { MappedData } from '@/types';

interface IncomeStatementSectionProps {
  title: string;
  items: { sarsItem: string; balance: number }[];
  mappedData: MappedData[];
  projectId: string;
  onMappingUpdate: (accountId: number, newSarsItem: string) => Promise<void>;
  showTotal?: boolean;
  isSubtotal?: boolean;
  isGrossProfit?: boolean;
  isNetProfit?: boolean;
}

function IncomeStatementSection({ 
  title, 
  items, 
  mappedData,
  projectId,
  onMappingUpdate,
  showTotal = true,
  isSubtotal = false,
  isGrossProfit = false,
  isNetProfit = false
}: IncomeStatementSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const total = items.reduce((sum, item) => sum + item.balance, 0);

  const toggleItem = (sarsItem: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [sarsItem]: !prev[sarsItem]
    }));
  };

  const getMappedAccounts = (sarsItem: string) => {
    return mappedData.filter(item => item.sarsItem === sarsItem && item.balance !== 0);
  };

  if (items.length === 0) return null;

  const bgClass = isGrossProfit ? 'bg-gray-50' : isNetProfit ? 'bg-gray-100' : '';

  return (
    <div className={`space-y-1 ${isSubtotal ? 'mt-2' : 'mt-4'}`}>
      <h3 className="font-bold text-gray-700">{title}</h3>
      {items.map(({ sarsItem, balance }) => (
        balance !== 0 && (
          <div key={sarsItem} className="space-y-1">
            <div 
              className="grid grid-cols-12 gap-4 hover:bg-gray-50 rounded-lg p-1 cursor-pointer" 
              onClick={() => toggleItem(sarsItem)}
            >
              <div className="col-span-8 pl-4 flex items-center">
                <span className="mr-2">{expandedItems[sarsItem] ? '▼' : '▶'}</span>
                {sarsItem}
              </div>
              <div className={`col-span-4 text-right tabular-nums ${balance > 0 ? 'text-red-600' : ''}`}>
                {balance > 0 ? `(${formatAmount(Math.abs(balance))})` : formatAmount(Math.abs(balance))}
              </div>
            </div>
            
            {expandedItems[sarsItem] && (
              <div className="pl-8 space-y-1">
                {getMappedAccounts(sarsItem).map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 text-sm text-gray-600">
                    <div className="col-span-8">{item.accountCode} - {item.accountName}</div>
                    <div className={`col-span-4 text-right tabular-nums ${item.balance > 0 ? 'text-red-600' : ''}`}>
                      {item.balance > 0 ? `(${formatAmount(Math.abs(item.balance))})` : formatAmount(Math.abs(item.balance))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ))}
      {showTotal && (
        <div className={`grid grid-cols-12 gap-4 font-bold border-t border-gray-300 pt-1 mt-1 ${bgClass}`}>
          <div className="col-span-8">Total {title}</div>
          <div className={`col-span-4 text-right tabular-nums ${total > 0 ? 'text-red-600' : ''}`}>
            {total > 0 ? `(${formatAmount(Math.abs(total))})` : formatAmount(Math.abs(total))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncomeStatementPage({ params }: { params: { id: string } }) {
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

  function transformMappedDataToIncomeStatement(mappedData: MappedData[]) {
    // Initialize income statement structure
    const incomeStatement = {
      income: {} as Record<string, number>,
      costOfSales: {} as Record<string, number>,
      otherIncome: {} as Record<string, number>,
      expenses: {} as Record<string, number>,
    };

    // First, aggregate balances for the same SARS items
    const aggregatedBalances = mappedData.reduce((acc, { sarsItem, balance }) => {
      if (!acc[sarsItem]) {
        acc[sarsItem] = 0;
      }
      acc[sarsItem] += balance;
      return acc;
    }, {} as Record<string, number>);

    // Initialize all possible SARS items from the mapping guide with 0
    Object.entries(mappingGuide.incomeStatement).forEach(([section, items]) => {
      items.forEach(({ sarsItem }) => {
        switch (section) {
          case 'income':
            incomeStatement.income[sarsItem] = 0;
            break;
          case 'costOfSales':
            incomeStatement.costOfSales[sarsItem] = 0;
            break;
          case 'otherIncome':
            incomeStatement.otherIncome[sarsItem] = 0;
            break;
          case 'expenses':
            incomeStatement.expenses[sarsItem] = 0;
            break;
        }
      });
    });

    // Map aggregated balances to the income statement structure
    Object.entries(aggregatedBalances).forEach(([sarsItem, balance]) => {
      // Find which section this SARS item belongs to
      Object.entries(mappingGuide.incomeStatement).forEach(([section, items]) => {
        const matchingItem = items.find(item => item.sarsItem === sarsItem);
        if (matchingItem) {
          switch (section) {
            case 'income':
              // For income: convert negative to positive (credit balances)
              incomeStatement.income[sarsItem] = balance < 0 ? -balance : balance;
              break;
            case 'costOfSales':
              // For cost of sales: keep original sign (debit balances)
              incomeStatement.costOfSales[sarsItem] = balance;
              break;
            case 'otherIncome':
              // For other income: convert negative to positive (credit balances)
              incomeStatement.otherIncome[sarsItem] = balance < 0 ? -balance : balance;
              break;
            case 'expenses':
              // For expenses: keep original sign (debit balances)
              incomeStatement.expenses[sarsItem] = balance;
              break;
          }
        }
      });
    });

    return incomeStatement;
  }

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

  const incomeStatement = transformMappedDataToIncomeStatement(mappedData);

  // Calculate totals
  const totalIncome = Object.values(incomeStatement.income).reduce((sum, val) => sum + val, 0);
  const totalCostOfSales = Object.values(incomeStatement.costOfSales).reduce((sum, val) => sum + val, 0);
  const grossProfit = totalIncome - totalCostOfSales;
  const totalOtherIncome = Object.values(incomeStatement.otherIncome).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(incomeStatement.expenses).reduce((sum, val) => sum + val, 0);
  const netProfitBeforeTax = grossProfit + totalOtherIncome - totalExpenses;

  // Transform data for each section
  const incomeItems = Object.entries(incomeStatement.income)
    .filter(([_, balance]) => balance !== 0)
    .map(([sarsItem, balance]) => ({ sarsItem, balance: -balance })); // Negate for display

  const costOfSalesItems = Object.entries(incomeStatement.costOfSales)
    .filter(([_, balance]) => balance !== 0)
    .map(([sarsItem, balance]) => ({ sarsItem, balance }));

  const otherIncomeItems = Object.entries(incomeStatement.otherIncome)
    .filter(([_, balance]) => balance !== 0)
    .map(([sarsItem, balance]) => ({ sarsItem, balance: -balance })); // Negate for display

  const expenseItems = Object.entries(incomeStatement.expenses)
    .filter(([_, balance]) => balance !== 0)
    .map(([sarsItem, balance]) => ({ sarsItem, balance }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">{projectName}</h2>
        <p className="text-sm text-gray-500">Income Statement</p>
        <p className="text-sm text-gray-500">For the year ended {new Date().toLocaleDateString('en-ZA')}</p>
      </div>

      <div className="space-y-6">
        {/* Income */}
        <IncomeStatementSection
          title="Income"
          items={incomeItems}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Cost of Sales */}
        <IncomeStatementSection
          title="Cost of Sales"
          items={costOfSalesItems}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Gross Profit */}
        <div className="grid grid-cols-12 gap-4 font-bold border-t border-b border-gray-300 py-2 bg-gray-50">
          <div className="col-span-8">GROSS PROFIT</div>
          <div className={`col-span-4 text-right tabular-nums ${grossProfit < 0 ? 'text-red-600' : ''}`}>
            {grossProfit < 0 ? `(${formatAmount(Math.abs(grossProfit))})` : formatAmount(grossProfit)}
          </div>
        </div>

        {/* Other Income */}
        <IncomeStatementSection
          title="Other Income"
          items={otherIncomeItems}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Expenses */}
        <IncomeStatementSection
          title="Expenses"
          items={expenseItems}
          mappedData={mappedData}
          projectId={params.id}
          onMappingUpdate={handleMappingUpdate}
        />

        {/* Net Profit Before Tax */}
        <div className="grid grid-cols-12 gap-4 font-bold border-t border-b border-gray-300 py-2 bg-gray-100">
          <div className="col-span-8">NET PROFIT/(LOSS) BEFORE TAX</div>
          <div className={`col-span-4 text-right tabular-nums ${netProfitBeforeTax < 0 ? 'text-red-600' : ''}`}>
            {netProfitBeforeTax < 0 ? `(${formatAmount(Math.abs(netProfitBeforeTax))})` : formatAmount(netProfitBeforeTax)}
          </div>
        </div>
      </div>
    </div>
  );
} 