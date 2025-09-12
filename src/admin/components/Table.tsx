// src/admin/components/Table.tsx
import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  onRowClick
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-8 text-center text-gray-600">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item, rowIndex)}
              >
                {columns.map((column, colIndex) => {
                  const value = typeof column.key === 'string' 
                    ? column.key.split('.').reduce((obj, key) => obj?.[key], item)
                    : item[column.key];
                  
                  return (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.className || ''
                      }`}
                    >
                      {column.render ? column.render(value, item) : String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
