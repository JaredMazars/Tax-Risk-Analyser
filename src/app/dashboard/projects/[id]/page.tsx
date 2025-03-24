'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileUpload } from '@/components/FileUpload';
import { utils, write } from 'xlsx';
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MappedData {
  accountCode: string;
  account: string;
  section: string;
  balance: number;
  sarsItem: string;
}

interface TabProps {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

function Tab({ selected, children, onClick, className = '' }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        selected
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface BalanceSheetData {
  nonCurrentAssets: {
    fixedAssets: {
      fixedProperty: number;
      fixedAssetsOther: number;
      fixedAssetsProperty: number;
      plantAndEquipment: number;
      other: number;
      goodwillAndIntellectual: number;
    };
    investments: {
      inSubsidiaries: number;
    };
    loans: {
      interestFreeConnectedLocal: number;
      interestFreeNonConnectedLocal: number;
      interestFreeConnectedForeign: number;
      interestFreeNonConnectedForeign: number;
      interestBearingConnectedLocal: number;
      interestBearingNonConnectedLocal: number;
      interestBearingConnectedForeign: number;
      interestBearingNonConnectedForeign: number;
    };
    deferredTax: number;
    otherNonCurrentAssets: number;
  };
  currentAssets: {
    inventory: {
      gross: number;
      provisions: number;
    };
    tradeReceivables: {
      gross: number;
      provisions: number;
    };
    debtors: {
      gross: number;
      provisions: number;
    };
    prepayments: number;
    groupCompaniesAccounts: number;
    shortTermInvestments: number;
    saRevenueService: number;
    cashAndEquivalents: number;
    otherCurrentAssets: number;
  };
  capitalAndReserves: {
    shareCapital: number;
    sharePremium: number;
    nonDistributableReserves: number;
    distributableReserves: number;
    retainedIncome: number;
    otherCapitalAndReserves: number;
  };
  debitBalances: {
    accumulatedLoss: number;
    otherCapitalAndReservesDebit: number;
  };
  nonCurrentLiabilities: {
    loans: {
      interestFreeNonConnectedLocal: number;
      interestFreeConnectedLocal: number;
      interestFreeConnectedForeign: number;
      interestFreeNonConnectedForeign: number;
      interestBearingConnectedLocal: number;
      interestBearingNonConnectedLocal: number;
      interestBearingConnectedForeign: number;
      interestBearingNonConnectedForeign: number;
      interestBearingConnectedForeing: number;
    };
    deferredTax: number;
    otherNonCurrentLiabilities: number;
  };
  currentLiabilities: {
    tradePayables: {
      notOlderThanThreeYears: number;
      olderThanThreeYears: number;
    };
    provisions: number;
    deposits: number;
    groupCompaniesAccounts: number;
    contractProgress: number;
    currentPortionInterestBearing: number;
    currentPortionInterestFree: number;
    overdraft: number;
    saRevenueService: number;
    shareholdersDividend: number;
    otherCurrentLiabilities: number;
  };
}

function BalanceSheetSection({ title, amount, className = '', isTotal = false }: { 
  title: string; 
  amount: number | null; 
  className?: string;
  isTotal?: boolean;
}) {
  const formattedAmount = amount?.toLocaleString('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }) || 'R 0.00';

  return (
    <div className={`flex justify-between items-center py-2 ${className} ${isTotal ? 'font-bold' : ''}`}>
      <span>{title}</span>
      <span className="tabular-nums">{formattedAmount}</span>
    </div>
  );
}

function BalanceSheetGroup({ 
  title, 
  items, 
  level = 0,
  defaultExpanded = false 
}: { 
  title: string;
  items: { label: string; value: number | null }[];
  level?: number;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const paddingLeft = `${level * 1.5}rem`;
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 transition-colors
          ${level === 0 ? 'font-semibold bg-gray-50' : ''}`}
        style={{ paddingLeft }}
      >
        <div className="flex items-center">
          {items.length > 0 && (
            isExpanded ? 
              <ChevronDownIcon className="h-4 w-4 mr-2" /> : 
              <ChevronRightIcon className="h-4 w-4 mr-2" />
          )}
          <span>{title}</span>
        </div>
        <span className="pr-4 tabular-nums">
          {total.toLocaleString('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2
          })}
        </span>
      </button>
      {isExpanded && items.length > 0 && (
        <div className="py-1">
          {items.map((item, index) => (
            <BalanceSheetSection
              key={index}
              title={item.label}
              amount={item.value}
              className={`pl-${level + 2} hover:bg-gray-50`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('mapping');
  const [mappedData, setMappedData] = useState<MappedData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectId = parseInt(params.id, 10);

  useEffect(() => {
    const fetchMappedData = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/mapped-accounts`);
        if (!response.ok) {
          throw new Error('Failed to fetch mapped data');
        }
        const data = await response.json();
        setMappedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mapped data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMappedData();
  }, [projectId]);

  const downloadJSON = () => {
    if (!mappedData) return;
    
    const dataStr = JSON.stringify(mappedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mapped_trial_balance.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    if (!mappedData) return;
    
    const worksheet = utils.json_to_sheet(mappedData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Mapped Trial Balance');

    const wbout = write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mapped_trial_balance.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!mappedData) return { balanceSheet: 0, incomeStatement: 0 };
    
    return mappedData.reduce((acc, item) => {
      if (item.section.toLowerCase() === 'balance sheet') {
        acc.balanceSheet += item.balance;
      } else if (item.section.toLowerCase() === 'income statement') {
        acc.incomeStatement += item.balance;
      }
      return acc;
    }, { balanceSheet: 0, incomeStatement: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
            <p className="mt-2 text-sm text-gray-600">Project ID: {projectId}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <Tab
            selected={activeTab === 'mapping'}
            onClick={() => setActiveTab('mapping')}
          >
            Mapping
          </Tab>
          <Tab
            selected={activeTab === 'balance-sheet'}
            onClick={() => setActiveTab('balance-sheet')}
          >
            Balance Sheet
          </Tab>
          <Tab
            selected={activeTab === 'analysis'}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </Tab>
          <Tab
            selected={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </Tab>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'mapping' && (
          <div className="space-y-8">
            <FileUpload onFileUpload={setMappedData} projectId={projectId} />
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : mappedData && mappedData.length > 0 ? (
              <div className="space-y-4 bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Mapped Results</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={downloadJSON}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download JSON
                    </button>
                    
                    <button
                      onClick={downloadExcel}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Download Excel
                    </button>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Balance Sheet Total</h3>
                    <p className="text-lg font-semibold text-blue-900">
                      {totals.balanceSheet.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'USD'
                      })}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800 mb-2">Income Statement Total</h3>
                    <p className="text-lg font-semibold text-green-900">
                      {totals.incomeStatement.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'USD'
                      })}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th scope="col" className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th scope="col" className="w-32 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th scope="col" className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SARS Item
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mappedData.map((item, index) => {
                        const isBalanceSheet = item.section.toLowerCase() === 'balance sheet';
                        const rowClass = isBalanceSheet 
                          ? index % 2 === 0 ? 'bg-blue-50/30' : 'bg-blue-50/20'
                          : index % 2 === 0 ? 'bg-green-50/30' : 'bg-green-50/20';

                        return (
                          <tr key={index} className={rowClass}>
                            <td className="px-3 py-2 text-sm text-gray-900 truncate">
                              {item.accountCode}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 truncate">
                              {item.account}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium truncate
                                ${isBalanceSheet ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {item.section}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right tabular-nums">
                              {item.balance.toLocaleString('en-US', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 truncate" title={item.sarsItem}>
                              {item.sarsItem}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No mapped data available. Upload a trial balance file to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'balance-sheet' && mappedData && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Balance Sheet</h2>
              <p className="text-sm text-gray-500">As at 31 December 2023</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Non-Current Assets */}
                <BalanceSheetGroup
                  title="Non-Current Assets"
                  defaultExpanded={true}
                  items={[
                    { label: "Fixed Property", value: 0 },
                    { label: "Fixed Assets (Other)", value: 0 },
                    { label: "Fixed Assets Property", value: 1684910 },
                    { label: "Plant and Equipment", value: 94597093 },
                    { label: "Other Fixed Assets", value: 2196333 },
                    { label: "Goodwill and Intellectual Property", value: 17703923 },
                    { label: "Other Non-Current Assets", value: 508512641 }
                  ]}
                />

                {/* Current Assets */}
                <BalanceSheetGroup
                  title="Current Assets"
                  defaultExpanded={true}
                  items={[
                    { label: "Gross Inventory", value: 483195068 },
                    { label: "Inventory Provisions", value: -14711757 },
                    { label: "Gross Trade Receivables", value: 49046167 },
                    { label: "Trade Receivables Provisions", value: -167674 },
                    { label: "Prepayments", value: 12290966 },
                    { label: "Cash and Cash Equivalents", value: 214595754 }
                  ]}
                />

                {/* Capital and Reserves */}
                <BalanceSheetGroup
                  title="Capital and Reserves"
                  defaultExpanded={true}
                  items={[
                    { label: "Share Capital", value: 1593500000 },
                    { label: "Accumulated Loss", value: -1490609666 }
                  ]}
                />

                {/* Non-Current Liabilities */}
                <BalanceSheetGroup
                  title="Non-Current Liabilities"
                  defaultExpanded={true}
                  items={[
                    { label: "Other Non-Current Liabilities", value: 575765937 }
                  ]}
                />

                {/* Current Liabilities */}
                <BalanceSheetGroup
                  title="Current Liabilities"
                  defaultExpanded={true}
                  items={[
                    { label: "Trade Payables (< 3 years)", value: 396608475 },
                    { label: "Provisions", value: 12761176 },
                    { label: "Group Companies Current Accounts", value: 204856667 },
                    { label: "Other Current Liabilities", value: 76060235 }
                  ]}
                />

                {/* Total */}
                <BalanceSheetSection
                  title="TOTAL ASSETS"
                  amount={1368942824}
                  isTotal={true}
                  className="pt-4 border-t border-gray-200"
                />
                <BalanceSheetSection
                  title="TOTAL LIABILITIES"
                  amount={1368942824}
                  isTotal={true}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis</h2>
            <p className="text-gray-600">Analysis features coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Project settings coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
} 