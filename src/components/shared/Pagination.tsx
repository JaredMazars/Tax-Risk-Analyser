import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(page => {
        return (
          page === 1 ||
          page === totalPages ||
          (page >= currentPage - 1 && page <= currentPage + 1)
        );
      });
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm font-medium text-forvis-gray-700 bg-white border border-forvis-gray-300 rounded-md hover:bg-forvis-gray-50 disabled:bg-forvis-gray-100 disabled:text-forvis-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index, array) => {
          const prevPage = array[index - 1];
          const showEllipsis = prevPage && page - prevPage > 1;
          
          return (
            <div key={page} className="flex items-center">
              {showEllipsis && <span className="px-2 text-forvis-gray-500">...</span>}
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentPage === page
                    ? 'bg-forvis-blue-600 text-white'
                    : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
                }`}
              >
                {page}
              </button>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm font-medium text-forvis-gray-700 bg-white border border-forvis-gray-300 rounded-md hover:bg-forvis-gray-50 disabled:bg-forvis-gray-100 disabled:text-forvis-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
