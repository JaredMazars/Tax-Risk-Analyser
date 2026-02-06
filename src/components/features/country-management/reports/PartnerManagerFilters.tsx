'use client';

/**
 * Partner and Manager Multi-Select Filters
 * 
 * Provides multi-select dropdowns for filtering reports by:
 * - Partners (employees with EmpCatCode in CARL, LOCAL, DIR)
 * - Managers (any active employee assigned as task manager)
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search, Users, UserCog } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { usePartnersList } from '@/hooks/country-management/usePartnersList';
import { useManagersList } from '@/hooks/country-management/useManagersList';

interface PartnerManagerFiltersProps {
  selectedPartners: string[];
  selectedManagers: string[];
  onPartnersChange: (partners: string[]) => void;
  onManagersChange: (managers: string[]) => void;
}

interface Employee {
  empCode: string;
  empName: string;
}

interface MultiSelectDropdownProps {
  label: string;
  icon: typeof Users;
  options: Employee[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  isLoading: boolean;
  placeholder: string;
}

function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selectedValues,
  onChange,
  isLoading,
  placeholder,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.empCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (empCode: string) => {
    if (selectedValues.includes(empCode)) {
      onChange(selectedValues.filter((v) => v !== empCode));
    } else {
      onChange([...selectedValues, empCode]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange(filteredOptions.map((opt) => opt.empCode));
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.empCode))
    .map((opt) => opt.empName);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-forvis-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white border border-forvis-gray-300 rounded-lg hover:bg-forvis-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-forvis-gray-500 flex-shrink-0" />
          {selectedValues.length === 0 ? (
            <span className="text-forvis-gray-500 truncate">{placeholder}</span>
          ) : selectedValues.length === 1 ? (
            <span className="truncate">{selectedLabels[0]}</span>
          ) : (
            <span className="text-forvis-blue-600 font-medium">
              {selectedValues.length} selected
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-forvis-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-forvis-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-forvis-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-forvis-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-forvis-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forvis-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-forvis-gray-100 bg-forvis-gray-50">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-forvis-blue-600 hover:text-forvis-blue-800"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-forvis-gray-600 hover:text-forvis-gray-800"
            >
              Clear all
            </button>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-forvis-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.empCode);
                return (
                  <button
                    key={opt.empCode}
                    type="button"
                    onClick={() => toggleOption(opt.empCode)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-forvis-gray-50 transition-colors ${
                      isSelected ? 'bg-forvis-blue-50' : ''
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-forvis-blue-600 border-forvis-blue-600'
                          : 'border-forvis-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="truncate">{opt.empName}</span>
                    <span className="text-forvis-gray-400 text-xs ml-auto">{opt.empCode}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Tags */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.slice(0, 3).map((label, index) => {
            const empCode = selectedValues[index];
            if (!empCode) return null;
            return (
              <span
                key={empCode}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-forvis-blue-100 text-forvis-blue-700 rounded-full"
              >
                {label}
                <button
                  type="button"
                  onClick={() => toggleOption(empCode)}
                  className="hover:text-forvis-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {selectedLabels.length > 3 && (
            <span className="text-xs text-forvis-gray-500 py-0.5">
              +{selectedLabels.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PartnerManagerFilters({
  selectedPartners,
  selectedManagers,
  onPartnersChange,
  onManagersChange,
}: PartnerManagerFiltersProps) {
  const { data: partners = [], isLoading: partnersLoading } = usePartnersList();
  const { data: managers = [], isLoading: managersLoading } = useManagersList();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MultiSelectDropdown
        label="Filter by Partner"
        icon={Users}
        options={partners}
        selectedValues={selectedPartners}
        onChange={onPartnersChange}
        isLoading={partnersLoading}
        placeholder="All partners"
      />
      <MultiSelectDropdown
        label="Filter by Manager"
        icon={UserCog}
        options={managers}
        selectedValues={selectedManagers}
        onChange={onManagersChange}
        isLoading={managersLoading}
        placeholder="All managers"
      />
    </div>
  );
}
