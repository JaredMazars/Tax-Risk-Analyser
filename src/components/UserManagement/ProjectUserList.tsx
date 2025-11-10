'use client';

import { useState } from 'react';
import { ProjectUser, ProjectRole } from '@/types';
import { RoleSelector } from './RoleSelector';

interface ProjectUserListProps {
  projectId: number;
  users: ProjectUser[];
  currentUserId: string;
  currentUserRole: ProjectRole;
  onUserRemoved: () => void;
  onRoleChanged: () => void;
}

export function ProjectUserList({
  projectId,
  users,
  currentUserId,
  currentUserRole,
  onUserRemoved,
  onRoleChanged,
}: ProjectUserListProps) {
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the project?')) {
      return;
    }

    setRemovingUserId(userId);

    try {
      const response = await fetch(`/api/projects/${projectId}/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onUserRemoved();
      } else {
        alert(data.error || 'Failed to remove user');
      }
    } catch (err) {
      alert('An error occurred while removing user');
    } finally {
      setRemovingUserId(null);
    }
  };

  const canManageUsers = currentUserRole === 'ADMIN';

  const getRoleBadgeColor = (role: ProjectRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'REVIEWER':
        return 'bg-blue-100 text-blue-800';
      case 'EDITOR':
        return 'bg-green-100 text-green-800';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2">
      {users.map((projectUser) => (
        <div
          key={projectUser.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
        >
          <div className="flex-1">
            <div className="font-medium">{projectUser.user?.name || projectUser.user?.email}</div>
            <div className="text-sm text-gray-600">{projectUser.user?.email}</div>
          </div>

          <div className="flex items-center gap-3">
            {canManageUsers && projectUser.userId !== currentUserId ? (
              <RoleSelector
                projectId={projectId}
                userId={projectUser.userId}
                currentRole={projectUser.role}
                onChange={onRoleChanged}
              />
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(projectUser.role)}`}>
                {projectUser.role}
              </span>
            )}

            {canManageUsers && projectUser.userId !== currentUserId && (
              <button
                onClick={() => handleRemoveUser(projectUser.userId)}
                disabled={removingUserId === projectUser.userId}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
              >
                {removingUserId === projectUser.userId ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      ))}

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users assigned to this project
        </div>
      )}
    </div>
  );
}

