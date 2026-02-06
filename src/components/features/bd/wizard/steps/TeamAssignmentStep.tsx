/**
 * BD Wizard Step 3: Team Assignment
 * Assign partner, manager, and incharge for the prospect client
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button, Banner } from '@/components/ui';
import type { StepProps, EmployeeOption } from '@/types/bd-wizard';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';

export function TeamAssignmentStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: StepProps) {
  const [partnerCode, setPartnerCode] = useState(
    wizardData.teamAssignment?.partnerCode || ''
  );
  const [managerCode, setManagerCode] = useState(
    wizardData.teamAssignment?.managerCode || ''
  );
  const [inchargeCode, setInchargeCode] = useState(
    wizardData.teamAssignment?.inchargeCode || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch partners (CARL, LOCAL, DIR categories only)
  const { data: partnersData } = useQuery({
    queryKey: ['bd-wizard-employees', 'partners'],
    queryFn: async () => {
      const res = await fetch('/api/bd/wizard/employees?role=partner');
      if (!res.ok) throw new Error('Failed to fetch partners');
      const result = await res.json();
      return result.data || [];
    },
  });

  // Fetch managers (exclude selected partner)
  const { data: managersData } = useQuery({
    queryKey: ['bd-wizard-employees', 'managers', partnerCode],
    queryFn: async () => {
      const excludeParam = partnerCode ? `&exclude=${partnerCode}` : '';
      const res = await fetch(`/api/bd/wizard/employees?role=all${excludeParam}`);
      if (!res.ok) throw new Error('Failed to fetch managers');
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!partnerCode,
  });

  // Fetch incharge employees (exclude partner and manager)
  const { data: inchargeData } = useQuery({
    queryKey: ['bd-wizard-employees', 'incharge', partnerCode, managerCode],
    queryFn: async () => {
      const exclude = [partnerCode, managerCode].filter(Boolean);
      const excludeParam = exclude.length > 0 ? `&exclude=${exclude.join(',')}` : '';
      const res = await fetch(`/api/bd/wizard/employees?role=all${excludeParam}`);
      if (!res.ok) throw new Error('Failed to fetch incharge employees');
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!partnerCode && !!managerCode,
  });

  // Validate assignments
  useEffect(() => {
    if (partnerCode && managerCode && inchargeCode) {
      const codes = [partnerCode, managerCode, inchargeCode];
      const uniqueCodes = new Set(codes);
      if (uniqueCodes.size !== codes.length) {
        setValidationError('Partner, Manager, and Incharge must be different people');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, [partnerCode, managerCode, inchargeCode]);

  const handleNext = () => {
    if (validationError) {
      return;
    }

    updateWizardData({
      teamAssignment: {
        partnerCode,
        managerCode,
        inchargeCode,
      },
    });
    onNext();
  };

  const canProceed =
    partnerCode && managerCode && inchargeCode && !validationError;

  const getEmployeeDisplay = (empCode: string, employees: EmployeeOption[]) => {
    const emp = employees.find((e) => e.EmpCode === empCode);
    return emp
      ? `${emp.EmpNameFull} (${emp.ServLineDesc})`
      : empCode;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Team Assignment
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Assign the partner, manager, and incharge for this prospect client. All three
          must be different people.
        </p>
      </div>

      {validationError && (
        <div className="mb-4">
          <Banner variant="error" message={validationError} />
        </div>
      )}

      <div className="space-y-6">
        {/* Partner Selection */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Client Partner * (CARL/LOCAL/DIR only)
          </label>
          <select
            value={partnerCode}
            onChange={(e) => {
              setPartnerCode(e.target.value);
              // Reset manager and incharge if partner changes
              if (e.target.value !== partnerCode) {
                setManagerCode('');
                setInchargeCode('');
              }
            }}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            required
          >
            <option value="">Select partner...</option>
            {partnersData?.map((emp: EmployeeOption) => (
              <option key={emp.EmpCode} value={emp.EmpCode}>
                {emp.EmpNameFull} ({emp.EmpCatDesc}) - {emp.ServLineDesc}
              </option>
            ))}
          </select>
          {partnerCode && partnersData && (
            <p className="mt-1 text-sm text-forvis-gray-600">
              Selected: {getEmployeeDisplay(partnerCode, partnersData)}
            </p>
          )}
        </div>

        {/* Manager Selection */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Client Manager *
          </label>
          <select
            value={managerCode}
            onChange={(e) => {
              setManagerCode(e.target.value);
              // Reset incharge if manager changes
              if (e.target.value !== managerCode) {
                setInchargeCode('');
              }
            }}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            disabled={!partnerCode}
            required
          >
            <option value="">Select manager...</option>
            {managersData?.map((emp: EmployeeOption) => (
              <option key={emp.EmpCode} value={emp.EmpCode}>
                {emp.EmpNameFull} - {emp.ServLineDesc}
              </option>
            ))}
          </select>
          {!partnerCode && (
            <p className="mt-1 text-sm text-forvis-gray-500">
              Select a partner first
            </p>
          )}
          {managerCode && managersData && (
            <p className="mt-1 text-sm text-forvis-gray-600">
              Selected: {getEmployeeDisplay(managerCode, managersData)}
            </p>
          )}
        </div>

        {/* Incharge Selection */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Client Incharge *
          </label>
          <select
            value={inchargeCode}
            onChange={(e) => setInchargeCode(e.target.value)}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            disabled={!partnerCode || !managerCode}
            required
          >
            <option value="">Select incharge...</option>
            {inchargeData?.map((emp: EmployeeOption) => (
              <option key={emp.EmpCode} value={emp.EmpCode}>
                {emp.EmpNameFull} - {emp.ServLineDesc}
              </option>
            ))}
          </select>
          {(!partnerCode || !managerCode) && (
            <p className="mt-1 text-sm text-forvis-gray-500">
              Select partner and manager first
            </p>
          )}
          {inchargeCode && inchargeData && (
            <p className="mt-1 text-sm text-forvis-gray-600">
              Selected: {getEmployeeDisplay(inchargeCode, inchargeData)}
            </p>
          )}
        </div>

        {/* Team Summary */}
        {partnerCode && managerCode && inchargeCode && !validationError && (
          <div className="bg-forvis-success-50 border border-forvis-success-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-forvis-success-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-forvis-success-900 mb-2">
                  Team Assigned
                </h4>
                <ul className="text-sm text-forvis-success-800 space-y-1">
                  <li>
                    <span className="font-medium">Partner:</span>{' '}
                    {partnersData && getEmployeeDisplay(partnerCode, partnersData)}
                  </li>
                  <li>
                    <span className="font-medium">Manager:</span>{' '}
                    {managersData && getEmployeeDisplay(managerCode, managersData)}
                  </li>
                  <li>
                    <span className="font-medium">Incharge:</span>{' '}
                    {inchargeData && getEmployeeDisplay(inchargeCode, inchargeData)}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-forvis-gray-200 mt-8">
        <Button onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button onClick={handleNext} variant="gradient" disabled={!canProceed}>
          Next
        </Button>
      </div>
    </div>
  );
}
