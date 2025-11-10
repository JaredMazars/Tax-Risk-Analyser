'use client';

import { useState, useEffect } from 'react';
import { ADUser, ProjectRole } from '@/types';

interface UserSearchModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export function UserSearchModal({ projectId, isOpen, onClose, onUserAdded }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ADUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ADUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('VIEWER' as ProjectRole);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setError('');
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        setError('Failed to search users');
      }
    } catch (err) {
      setError('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onUserAdded();
        onClose();
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError('An error occurred while adding user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add User to Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Active Directory
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search by name or email..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  {user.jobTitle && (
                    <div className="text-xs text-gray-500">{user.jobTitle}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VIEWER">Viewer - Read-only access</option>
              <option value="EDITOR">Editor - Can edit data</option>
              <option value="REVIEWER">Reviewer - Can approve/reject adjustments</option>
              <option value="ADMIN">Admin - Full project control</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAddUser}
            disabled={!selectedUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}

