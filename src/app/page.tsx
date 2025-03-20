'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { utils, write } from 'xlsx';

interface MappedData {
  accountCode: string;
  account: string;
  section: string;
  balance: number;
  subFSAName: string;
  subFSAId: string;
}

export default function Home() {
  const [mappedData, setMappedData] = useState<MappedData[] | null>(null);

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
    <main className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Trial Balance Mapper</h1>
      
      <FileUpload onFileUpload={setMappedData} />
      
      {mappedData && (
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
                    FSA Name
                  </th>
                  <th scope="col" className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FSA Code
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
                      <td className="px-3 py-2 text-sm text-gray-900 truncate" title={item.subFSAName}>
                        {item.subFSAName}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <code className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                          {item.subFSAId}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
