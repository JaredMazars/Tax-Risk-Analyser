/**
 * Permission Edit Modal Component
 * Modal for editing page permissions with role matrix
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Input } from '@/components/ui';
import { X } from 'lucide-react';
import { PageAccessLevel } from '@/types/pagePermissions';
import { AccessLevelBadge } from './AccessLevelBadge';

interface PermissionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    pathname: string;
    permissions: Record<string, PageAccessLevel>;
    description?: string;
  }) => Promise<void>;
  pathname?: string;
  initialPermissions?: Record<string, PageAccessLevel>;
  initialDescription?: string;
}

const roles = [
  'SYSTEM_ADMIN',
  'ADMINISTRATOR',
  'PARTNER',
  'MANAGER',
  'SUPERVISOR',
  'USER',
  'VIEWER',
] as const;

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: 'System Admin',
  ADMINISTRATOR: 'Administrator',
  PARTNER: 'Partner',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  USER: 'User',
  VIEWER: 'Viewer',
};

const presets: Record<string, Record<string, PageAccessLevel>> = {
  'Admin Only': {
    SYSTEM_ADMIN: PageAccessLevel.FULL,
    ADMINISTRATOR: PageAccessLevel.NONE,
    PARTNER: PageAccessLevel.NONE,
    MANAGER: PageAccessLevel.NONE,
    SUPERVISOR: PageAccessLevel.NONE,
    USER: PageAccessLevel.NONE,
    VIEWER: PageAccessLevel.NONE,
  },
  'Partners+': {
    SYSTEM_ADMIN: PageAccessLevel.FULL,
    ADMINISTRATOR: PageAccessLevel.FULL,
    PARTNER: PageAccessLevel.FULL,
    MANAGER: PageAccessLevel.NONE,
    SUPERVISOR: PageAccessLevel.NONE,
    USER: PageAccessLevel.NONE,
    VIEWER: PageAccessLevel.NONE,
  },
  'Managers+': {
    SYSTEM_ADMIN: PageAccessLevel.FULL,
    ADMINISTRATOR: PageAccessLevel.FULL,
    PARTNER: PageAccessLevel.FULL,
    MANAGER: PageAccessLevel.FULL,
    SUPERVISOR: PageAccessLevel.NONE,
    USER: PageAccessLevel.NONE,
    VIEWER: PageAccessLevel.NONE,
  },
  'All Access': {
    SYSTEM_ADMIN: PageAccessLevel.FULL,
    ADMINISTRATOR: PageAccessLevel.FULL,
    PARTNER: PageAccessLevel.FULL,
    MANAGER: PageAccessLevel.FULL,
    SUPERVISOR: PageAccessLevel.FULL,
    USER: PageAccessLevel.FULL,
    VIEWER: PageAccessLevel.VIEW,
  },
};

export function PermissionEditModal({
  isOpen,
  onClose,
  onSave,
  pathname: initialPathname,
  initialPermissions,
  initialDescription,
}: PermissionEditModalProps) {
  const [pathname, setPathname] = useState(initialPathname || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [permissions, setPermissions] = useState<Record<string, PageAccessLevel>>(
    initialPermissions || {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Array<{ pathname: string; category?: string }>>([]);
  const [pageSearch, setPageSearch] = useState('');
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPathname(initialPathname || '');
      setDescription(initialDescription || '');
      setPermissions(initialPermissions || {});
      setError(null);
      setPageSearch('');
      setShowPageDropdown(false);
      
      // Load page registry if creating new permission
      if (!initialPathname) {
        loadPages();
      }
    }
  }, [isOpen, initialPathname, initialPermissions, initialDescription]);

  const loadPages = async () => {
    setLoadingPages(true);
    try {
      const response = await fetch('/api/admin/page-permissions/registry?active=true');
      if (response.ok) {
        const data = await response.json();
        setPages(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoadingPages(false);
    }
  };

  const filteredPages = pageSearch
    ? pages.filter((page) => page.pathname.toLowerCase().includes(pageSearch.toLowerCase())).slice(0, 50)
    : pages.slice(0, 50); // Limit to 50 results for performance

  const handleSelectPage = (selectedPath: string) => {
    setPathname(selectedPath);
    setPageSearch(selectedPath);
    setShowPageDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPageDropdown(false);
      }
    };

    if (showPageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showPageDropdown]);

  const handlePresetClick = (presetName: string) => {
    const preset = presets[presetName];
    if (preset) {
      setPermissions(preset);
    }
  };

  const handleRoleChange = (role: string, level: PageAccessLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: level,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSave({
        pathname,
        permissions,
        description: description || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:w-full sm:max-w-4xl">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {initialPathname ? 'Edit Page Permission' : 'Add Page Permission'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Pathname */}
              <div>
                <label htmlFor="pathname" className="block text-sm font-medium text-gray-700">
                  Pathname
                </label>
                {initialPathname ? (
                  // Show readonly field when editing
                  <input
                    type="text"
                    id="pathname"
                    value={pathname}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forvis-blue-500 focus:ring-forvis-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                ) : (
                  // Show searchable dropdown when creating new
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      id="pathname"
                      value={pageSearch || pathname}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPageSearch(value);
                        setPathname(value);
                        setShowPageDropdown(true);
                      }}
                      onFocus={() => setShowPageDropdown(true)}
                      placeholder="Search for a page or type path..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forvis-blue-500 focus:ring-forvis-blue-500 sm:text-sm"
                      required
                    />
                    {showPageDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingPages ? (
                          <div className="px-4 py-2 text-sm text-gray-500">Loading pages...</div>
                        ) : filteredPages.length > 0 ? (
                          <>
                            <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs text-gray-600 border-b border-gray-200">
                              {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''} {filteredPages.length === 50 ? '(showing first 50)' : ''}
                            </div>
                            {filteredPages.map((page) => (
                              <button
                                key={page.pathname}
                                type="button"
                                onClick={() => handleSelectPage(page.pathname)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-0"
                              >
                                <div className="font-mono text-gray-900 text-xs">{page.pathname}</div>
                                {page.category && (
                                  <div className="text-xs text-gray-500 capitalize mt-1">{page.category}</div>
                                )}
                              </button>
                            ))}
                          </>
                        ) : pageSearch ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No pages found. Type a custom path or run page discovery.
                          </div>
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No pages discovered yet. Click "Discover Pages" to scan your application.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {initialPathname 
                    ? 'Pathname cannot be changed when editing'
                    : 'Search for a discovered page or type a custom path. Must start with /dashboard.'
                  }
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forvis-blue-500 focus:ring-forvis-blue-500 sm:text-sm"
                  placeholder="Brief description of this page..."
                />
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Presets
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(presets).map((presetName) => (
                    <Button
                      key={presetName}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePresetClick(presetName)}
                    >
                      {presetName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Role Access Matrix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Role Access Levels
                </label>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role} className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {roleLabels[role]}
                      </span>
                      <div className="flex gap-2">
                        {[PageAccessLevel.FULL, PageAccessLevel.VIEW, PageAccessLevel.NONE].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleRoleChange(role, level)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                              permissions[role] === level
                                ? level === PageAccessLevel.FULL
                                  ? 'bg-green-600 text-white border-green-600'
                                  : level === PageAccessLevel.VIEW
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-red-600 text-white border-red-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {level === PageAccessLevel.FULL
                              ? 'Full'
                              : level === PageAccessLevel.VIEW
                              ? 'View'
                              : 'None'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

