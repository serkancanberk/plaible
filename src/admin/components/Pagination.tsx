// src/admin/components/Pagination.tsx
import React from 'react';

interface Props {
  currentPage: number;
  hasNextPage: boolean;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<Props> = ({ 
  currentPage, 
  hasNextPage, 
  totalCount, 
  limit, 
  onPageChange 
}) => {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-700">
        {totalCount > 0 ? (
          <>Showing {startItem}–{endItem} of {totalCount} users</>
        ) : (
          <>No users found</>
        )}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
