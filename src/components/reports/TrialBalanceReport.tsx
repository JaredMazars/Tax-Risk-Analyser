'use client';

interface TrialBalanceAccount {
  id: number;
  accountCode: string;
  accountName: string;
  balance: number;
  priorYearBalance: number;
  sarsItem: string;
  section: string;
  subsection: string;
}

interface TrialBalanceReportProps {
  accounts: TrialBalanceAccount[];
}

export default function TrialBalanceReport({ accounts }: TrialBalanceReportProps) {
  // Calculate totals
  const currentYearDebits = accounts
    .filter(acc => acc.balance > 0)
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  const currentYearCredits = accounts
    .filter(acc => acc.balance < 0)
    .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  
  const priorYearDebits = accounts
    .filter(acc => acc.priorYearBalance > 0)
    .reduce((sum, acc) => sum + acc.priorYearBalance, 0);
  
  const priorYearCredits = accounts
    .filter(acc => acc.priorYearBalance < 0)
    .reduce((sum, acc) => sum + Math.abs(acc.priorYearBalance), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-1">Current Year Debits</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(currentYearDebits)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium mb-1">Current Year Credits</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(currentYearCredits)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium mb-1">Prior Year Debits</p>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(priorYearDebits)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm text-amber-600 font-medium mb-1">Prior Year Credits</p>
          <p className="text-2xl font-bold text-amber-900">{formatCurrency(priorYearCredits)}</p>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Code
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SARS Item
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Year Debit
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Year Credit
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prior Year Debit
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prior Year Credit
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.accountCode}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {account.accountName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {account.sarsItem}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {account.balance > 0 ? formatCurrency(account.balance) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {account.balance < 0 ? formatCurrency(Math.abs(account.balance)) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                  {account.priorYearBalance > 0 ? formatCurrency(account.priorYearBalance) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                  {account.priorYearBalance < 0 ? formatCurrency(Math.abs(account.priorYearBalance)) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr className="font-bold">
              <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                Totals
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {formatCurrency(currentYearDebits)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {formatCurrency(currentYearCredits)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                {formatCurrency(priorYearDebits)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                {formatCurrency(priorYearCredits)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Balance Check */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Balance Check (Current Year)</p>
            <p className="text-xs text-gray-500 mt-1">
              Debits should equal credits for a balanced trial balance
            </p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${
              Math.abs(currentYearDebits - currentYearCredits) < 0.01
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {Math.abs(currentYearDebits - currentYearCredits) < 0.01
                ? '✓ Balanced'
                : `⚠ Out of Balance: ${formatCurrency(Math.abs(currentYearDebits - currentYearCredits))}`
              }
            </p>
          </div>
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No trial balance accounts found.</p>
          <p className="text-sm mt-2">Upload a trial balance to see the report.</p>
        </div>
      )}
    </div>
  );
}


