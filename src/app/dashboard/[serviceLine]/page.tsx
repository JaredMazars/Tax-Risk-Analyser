'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  ArchiveBoxIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  ArrowPathIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CreateProjectModal } from '@/components/features/projects/CreateProjectModal';
import { getProjectTypeColor, formatProjectType, getProjectTypeBorderColor } from '@/lib/utils/projectUtils';
import { isValidServiceLine, formatServiceLineName } from '@/lib/utils/serviceLineUtils';
import { useServiceLine } from '@/components/providers/ServiceLineProvider';
import { ServiceLine } from '@/types';

interface Project {
  id: number;
  name: string;
  description?: string;
  projectType: string;
  serviceLine: string;
  taxYear?: number | null;
  clientId?: number | null;
  client?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  _count: {
    mappings: number;
    taxAdjustments: number;
  };
}

export default function ServiceLineWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const serviceLine = (params.serviceLine as string)?.toUpperCase();
  const { setCurrentServiceLine } = useServiceLine();
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editProject, setEditProject] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);
  const [filters, setFilters] = useState({
    projectType: '',
    clientId: '',
    taxYear: ''
  });

  // Validate service line
  useEffect(() => {
    if (!isValidServiceLine(serviceLine)) {
      router.push('/dashboard');
    } else {
      setCurrentServiceLine(serviceLine as ServiceLine);
    }
  }, [serviceLine, router, setCurrentServiceLine]);

  useEffect(() => {
    if (isValidServiceLine(serviceLine)) {
      fetchProjects();
      fetchClients();
    }
  }, [serviceLine, showArchivedProjects]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    
    return undefined;
  }, [openDropdown]);

  useEffect(() => {
    let filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filters.projectType) {
      filtered = filtered.filter(project => project.projectType === filters.projectType);
    }
    if (filters.clientId) {
      filtered = filtered.filter(project => project.clientId?.toString() === filters.clientId);
    }
    if (filters.taxYear) {
      filtered = filtered.filter(project => project.taxYear?.toString() === filters.taxYear);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, projects, filters]);

  const fetchProjects = async () => {
    try {
      const url = showArchivedProjects 
        ? `/api/projects?includeArchived=true&serviceLine=${serviceLine}` 
        : `/api/projects?serviceLine=${serviceLine}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const result = await response.json();
      const data = result.success ? result.data : result;
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setProjects([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) return;
      const data = await response.json();
      setClients(data.success ? data.data.clients : []);
    } catch (error) {
      setClients([]);
    }
  };

  const handleNewProjectClick = () => {
    setShowModal(true);
  };

  const handleEditClick = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setEditProject({ name: project.name, description: project.description || '' });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleRestoreClick = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setShowRestoreModal(true);
    setOpenDropdown(null);
  };

  const handlePermanentDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setShowPermanentDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleProjectCreated = async (project: any) => {
    setShowModal(false);
    await fetchProjects();
    router.push(`/dashboard/${serviceLine.toLowerCase()}/projects/${project.id}`);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editProject.name.trim() || !selectedProject) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editProject),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      setShowEditModal(false);
      await fetchProjects();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to archive project');
      }

      setShowDeleteModal(false);
      await fetchProjects();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'restore' }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore project');
      }

      setShowRestoreModal(false);
      await fetchProjects();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/permanent`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete project');
      }

      setShowPermanentDeleteModal(false);
      await fetchProjects();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderProjectRow = (project: Project) => (
    <div
      key={project.id}
      className={`group rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border ${
        project.archived 
          ? 'bg-forvis-gray-50 border-forvis-gray-300 opacity-75' 
          : 'bg-white border-forvis-gray-200'
      }`}
    >
      <Link href={`/dashboard/${serviceLine.toLowerCase()}/projects/${project.id}`} className="block p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              project.archived ? 'bg-forvis-gray-200' : 'bg-forvis-blue-100'
            }`}>
              <FolderIcon className={`h-5 w-5 ${
                project.archived ? 'text-forvis-gray-500' : 'text-forvis-blue-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-base font-semibold truncate ${
                  project.archived ? 'text-forvis-gray-600' : 'text-forvis-gray-900'
                }`}>
                  {project.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getProjectTypeColor(project.projectType)}`}>
                  {formatProjectType(project.projectType)}
                </span>
                {project.taxYear && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {project.taxYear}
                  </span>
                )}
                {project.archived && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-forvis-gray-200 text-forvis-gray-700">
                    Archived
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {project.client && (
                  <p className="text-sm text-forvis-gray-500 truncate">
                    {project.client.name}
                  </p>
                )}
                {project.description && (
                  <>
                    {project.client && <span className="text-forvis-gray-400">•</span>}
                    <p className="text-sm text-forvis-gray-600 truncate">
                      {project.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-8 ml-4">
            <div className="text-sm text-forvis-gray-600">
              <span className="font-medium">{project._count.mappings}</span> accounts
            </div>
            <div className="text-sm text-forvis-gray-600">
              <span className="font-medium">{project._count.taxAdjustments}</span> adjustments
            </div>
            <div className="text-sm text-forvis-gray-500 w-24">
              {formatDate(project.updatedAt)}
            </div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === project.id ? null : project.id);
                }}
                className="p-1 rounded-lg hover:bg-forvis-gray-100 transition-colors"
              >
                <EllipsisVerticalIcon className="h-5 w-5 text-forvis-gray-400" />
              </button>
              
              {openDropdown === project.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-corporate-lg border border-forvis-gray-200 py-1 z-10">
                  <button
                    onClick={(e) => handleEditClick(project, e)}
                    className="w-full text-left px-4 py-2 text-sm text-forvis-gray-700 hover:bg-forvis-gray-50 flex items-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit Project</span>
                  </button>
                  {project.archived ? (
                    <>
                      <button
                        onClick={(e) => handleRestoreClick(project, e)}
                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>Restore Project</span>
                      </button>
                      <button
                        onClick={(e) => handlePermanentDeleteClick(project, e)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete Permanently</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(project, e)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <ArchiveBoxIcon className="h-4 w-4" />
                      <span>Archive Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );

  if (!isValidServiceLine(serviceLine)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-forvis-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Service Lines */}
        <div className="py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-forvis-gray-600 hover:text-forvis-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Service Lines
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-forvis-gray-900">
              {formatServiceLineName(serviceLine)} Projects
            </h1>
            <p className="mt-1 text-sm text-forvis-gray-700">
              Manage your {formatServiceLineName(serviceLine).toLowerCase()} projects
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleNewProjectClick}
            className="btn-primary"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Search and view controls */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-lg">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-forvis-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.projectType}
              onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}
              className="px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Types</option>
              {/* Types will be filtered by service line in a moment */}
            </select>

            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id.toString()}>
                  {client.name}
                </option>
              ))}
            </select>

            {filters.projectType || filters.clientId ? (
              <button
                onClick={() => setFilters({ projectType: '', clientId: '', taxYear: '' })}
                className="px-3 py-2 text-sm text-forvis-gray-700 bg-forvis-gray-100 hover:bg-forvis-gray-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            ) : null}

            <div className="flex-1"></div>
            
            <label className="flex items-center space-x-2 text-sm text-forvis-gray-700 font-medium">
              <input
                type="checkbox"
                checked={showArchivedProjects}
                onChange={(e) => setShowArchivedProjects(e.target.checked)}
                className="rounded border-forvis-gray-300 text-forvis-blue-500 focus:ring-forvis-blue-500"
              />
              <span>Show archived</span>
            </label>
          </div>
        </div>

        <CreateProjectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleProjectCreated}
        />

        {/* Edit, Delete, Restore, Permanent Delete Modals - Same as before */}
        {/* ... */}

        {/* Projects list */}
        {filteredProjects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-forvis-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-forvis-gray-600">
              {searchTerm ? 'No projects match your search.' : 'Get started by creating a new project.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleNewProjectClick}
                  className="btn-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  New Project
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => renderProjectRow(project))}
          </div>
        )}
      </div>
    </div>
  );
}
