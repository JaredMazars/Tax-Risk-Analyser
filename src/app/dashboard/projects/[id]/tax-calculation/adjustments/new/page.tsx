'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NewAdjustmentProps {
  params: { id: string };
}

export default function NewAdjustmentPage({ params }: NewAdjustmentProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'DEBIT',
    description: '',
    amount: 0,
    sarsSection: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || formData.amount === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch(
        `/api/projects/${params.id}/tax-adjustments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            status: 'APPROVED', // Custom adjustments start as approved
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create adjustment');
      }

      const result = await response.json();
      const createdAdjustment = result.success ? result.data : result;
      router.push(`/dashboard/projects/${params.id}/tax-calculation/adjustments/${createdAdjustment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create adjustment');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-1 flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tax Calculation
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Create Custom Tax Adjustment
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="DEBIT">Debit (Add Back to Income)</option>
              <option value="CREDIT">Credit (Deduct from Income)</option>
              <option value="ALLOWANCE">Allowance / Recoupment</option>
            </select>
            <p className="mt-1 text-xs text-gray-600">
              {formData.type === 'DEBIT' && 'Increases taxable income (e.g., non-deductible expenses)'}
              {formData.type === 'CREDIT' && 'Decreases taxable income (e.g., capital allowances)'}
              {formData.type === 'ALLOWANCE' && 'Recoupments or prior year allowances'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="e.g., Non-deductible entertainment expenses"
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (R) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-600">
              Enter the absolute value. The sign will be determined by the type.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SARS Section
            </label>
            <input
              type="text"
              value={formData.sarsSection}
              onChange={(e) => setFormData({ ...formData, sarsSection: e.target.value })}
              placeholder="e.g., s23(g), s11(e), s12C"
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-600">
              Reference the relevant section of the Income Tax Act
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Reasoning
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Explain the reason for this adjustment and how it was calculated..."
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md"
            >
              {isCreating ? (
                <>
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Creating...
                  </div>
                </>
              ) : (
                'Create Adjustment'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4">
        <h2 className="text-base font-semibold text-blue-900 mb-3">
          Common Adjustment Examples
        </h2>
        <div className="space-y-3 text-sm text-blue-900">
          <div>
            <p className="font-semibold text-blue-900">Debit Adjustments (Add Back):</p>
            <ul className="list-disc list-inside ml-4 mt-1 text-blue-800">
              <li>Depreciation (s11(e)) - Add back accounting depreciation</li>
              <li>Entertainment expenses (s23(b)) - Non-deductible</li>
              <li>Fines and penalties (s23(o)) - Non-deductible</li>
              <li>Donations exceeding 10% limit (s18A)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-blue-900">Credit Adjustments (Deduct):</p>
            <ul className="list-disc list-inside ml-4 mt-1 text-blue-800">
              <li>Capital allowances (s11-13) - Tax depreciation</li>
              <li>Doubtful debt allowance (s11(j))</li>
              <li>R&D deduction (s11D)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-blue-900">Allowances / Recoupments:</p>
            <ul className="list-disc list-inside ml-4 mt-1 text-blue-800">
              <li>s24C allowance recoupment</li>
              <li>Prior year doubtful debt recovered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


