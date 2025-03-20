'use client';

import { useState } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileUpload: (data: any) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [trialBalanceFile, setTrialBalanceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!trialBalanceFile) {
      setError('Please upload a Trial Balance file.');
      return;
    }

    const formData = new FormData();
    formData.append('trialBalance', trialBalanceFile);

    setIsLoading(true);

    try {
      const res = await fetch('/api/map', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Something went wrong');
      }

      const data = await res.json();
      onFileUpload(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Format Guide Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-start space-x-4">
          <DocumentTextIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
          <div className="space-y-4 w-full">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Excel File Format Requirements</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please ensure your Trial Balance Excel file includes these columns:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Account Code', 'Account', 'Section', 'Balance'].map((column) => (
                  <div key={column} className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                    <p className="text-sm font-medium text-blue-700">{column}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center space-x-2 mb-2">
                <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                <h4 className="text-sm font-medium text-gray-900">Important Notes:</h4>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-1">
                <li>The <span className="font-medium">Section</span> column must contain either "Balance Sheet" or "Income Statement"</li>
                <li>The <span className="font-medium">Balance</span> column should contain numerical values</li>
                <li>Ensure there are no empty cells in required columns</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Example Excel Format:</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Account Code</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Account</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Section</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="px-4 py-2 text-gray-900">1000</td>
                      <td className="px-4 py-2 text-gray-900">Cash at Bank</td>
                      <td className="px-4 py-2 text-gray-900">Balance Sheet</td>
                      <td className="px-4 py-2 text-right text-gray-900">50000.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-900">4000</td>
                      <td className="px-4 py-2 text-gray-900">Sales Revenue</td>
                      <td className="px-4 py-2 text-gray-900">Income Statement</td>
                      <td className="px-4 py-2 text-right text-gray-900">-75000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Upload Trial Balance</span>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors duration-200">
                <div className="space-y-2 text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setTrialBalanceFile(e.target.files?.[0] || null)}
                        required
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                  {trialBalanceFile && (
                    <p className="text-sm text-green-600 font-medium">
                      Selected: {trialBalanceFile.name}
                    </p>
                  )}
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              } 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Upload and Map'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 