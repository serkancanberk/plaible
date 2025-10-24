import React, { useState, useEffect } from 'react';
import { Table } from './Table';
import { Package } from './PackageStats';

interface PackageTableProps {
  packages: Package[];
  loading?: boolean;
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

// Helper function for safe money formatting
const formatMoney = (value: number | null | undefined): string => {
  if (value == null || !isFinite(value)) return '—';
  return `$${value.toFixed(2)}`;
};

export const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  loading = false,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const [sortKey, setSortKey] = useState<string>('sortOrder');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Log package load
  useEffect(() => {
    console.log('[PACKAGE_UI][LOAD] Packages loaded:', packages.length);
  }, [packages.length]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedPackages = [...packages].sort((a, b) => {
    let aValue: any = a[sortKey as keyof Package];
    let bValue: any = b[sortKey as keyof Package];

    // Handle special cases
    if (sortKey === 'totalCredits') {
      aValue = a.credits + a.bonus;
      bValue = b.credits + b.bonus;
    } else if (sortKey === 'pricePerCredit') {
      aValue = parseFloat(a.pricePerCredit);
      bValue = parseFloat(b.pricePerCredit);
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, pkg: Package) => (
        <div className="font-medium text-gray-900">{pkg.name}</div>
      )
    },
    {
      key: 'credits',
      label: 'Credits',
      sortable: true,
      render: (value: number, pkg: Package) => (
        <span className="font-semibold text-blue-600">{pkg.credits}</span>
      )
    },
    {
      key: 'bonus',
      label: 'Bonus',
      sortable: true,
      render: (value: number, pkg: Package) => (
        <span className="text-green-600">
          {pkg.bonus > 0 ? `+${pkg.bonus}` : '—'}
        </span>
      )
    },
    {
      key: 'totalCredits',
      label: 'Total',
      sortable: true,
      render: (value: any, pkg: Package) => (
        <span className="font-semibold text-purple-600">
          {pkg.totalCredits} credits
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, pkg: Package) => (
        <span className="font-medium">{formatMoney(Number(pkg.price))}</span>
      )
    },
    {
      key: 'pricePerCredit',
      label: 'Per Credit',
      sortable: true,
      render: (value: any, pkg: Package) => {
        // Safe calculation on frontend (even if backend provides it)
        const credits = Number(pkg.credits) || 0;
        const bonus = Number(pkg.bonus) || 0;
        const total = credits + bonus;
        const price = Number(pkg.price);
        const per = total > 0 && isFinite(price) ? price / total : null;
        
        return (
          <span className="text-gray-600">
            {formatMoney(per)}
          </span>
        );
      }
    },
    {
      key: 'isPopular',
      label: 'Popular',
      render: (value: boolean, pkg: Package) => (
        pkg.isPopular ? (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
            ⭐ Popular
          </span>
        ) : null
      )
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (value: boolean, pkg: Package) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          pkg.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {pkg.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (value: string, pkg: Package) => (
        <span className="text-gray-600">
          {new Date(pkg.updatedAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, pkg: Package) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(pkg)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleActive(pkg._id, !pkg.isActive)}
            className={`text-sm font-medium ${
              pkg.isActive 
                ? 'text-red-600 hover:text-red-800' 
                : 'text-green-600 hover:text-green-800'
            }`}
          >
            {pkg.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${pkg.name}"?`)) {
                console.log('[PACKAGE_UI][DELETE] Deleting package:', pkg._id);
                onDelete(pkg._id);
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Packages</h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage credit packages and pricing
        </p>
      </div>
      
      <Table
        data={sortedPackages}
        columns={columns}
        loading={loading}
        emptyMessage="No packages found"
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        className="min-w-full"
      />
    </div>
  );
};
