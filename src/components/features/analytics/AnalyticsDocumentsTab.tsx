'use client';

import { useState } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAnalyticsDocuments, useDeleteAnalyticsDocument } from '@/hooks/analytics/useClientAnalytics';

interface AnalyticsDocumentsTabProps {
  clientId: string | number;
}

export function AnalyticsDocumentsTab({ clientId }: AnalyticsDocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const { data: documentsData, isLoading } = useAnalyticsDocuments(clientId);
  const deleteMutation = useDeleteAnalyticsDocument();

  const documents = documentsData?.documents || [];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchTerm === '' || 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || doc.documentType === filterType;
    return matchesSearch && matchesType;
  });

  const documentTypes = ['ALL', ...Array.from(new Set(documents.map((d) => d.documentType)))];

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync({ clientId, documentId });
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forvis-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Error */}
      {deleteError && (
        <div className="rounded-lg p-3 bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{deleteError}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-forvis-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'ALL' ? 'All Types' : type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-3 border-dashed shadow-lg" style={{ borderColor: '#2E5AAC', borderWidth: '3px', background: 'linear-gradient(135deg, #F8FBFE 0%, #EEF6FC 100%)' }}>
          <DocumentTextIcon className="mx-auto h-16 w-16" style={{ color: '#2E5AAC' }} />
          <h3 className="mt-4 text-lg font-bold" style={{ color: '#1C3667' }}>
            {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
          </h3>
          <p className="mt-2 text-sm font-medium" style={{ color: '#2E5AAC' }}>
            {documents.length === 0 
              ? 'Upload financial documents in the Upload & Analyze tab'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-forvis-gray-200">
              <thead style={{ background: 'linear-gradient(to right, #2E5AAC, #25488A)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-forvis-gray-200">
                {filteredDocuments.map((doc, index) => (
                  <tr 
                    key={doc.id} 
                    className={`hover:bg-forvis-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className="h-5 w-5 text-forvis-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-forvis-gray-900 truncate">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-forvis-blue-100 text-forvis-blue-800">
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-forvis-gray-600">
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-forvis-gray-600">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-forvis-gray-600 text-right">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {filteredDocuments.length > 0 && (
        <div className="text-sm text-forvis-gray-600 text-center">
          Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

