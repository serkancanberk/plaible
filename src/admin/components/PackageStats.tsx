import React from 'react';

export interface Package {
  _id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  description?: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  totalCredits: number;
  pricePerCredit: string;
  bonusPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface PackageStatsProps {
  packages: Package[];
  loading?: boolean;
}

export const PackageStats: React.FC<PackageStatsProps> = ({ packages, loading = false }) => {
  // Calculate statistics
  const totalPackages = packages.length;
  const activePackages = packages.filter(p => p.isActive).length;
  const popularPackages = packages.filter(p => p.isPopular).length;
  const averagePrice = packages.length > 0 
    ? packages.reduce((sum, p) => sum + p.price, 0) / packages.length 
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Packages */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-blue-600 text-xl">📦</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-500">Total Packages</div>
            <div className="text-2xl font-bold text-gray-900">{totalPackages}</div>
          </div>
        </div>
      </div>

      {/* Active Packages */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-green-600 text-xl">✅</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-500">Active Packages</div>
            <div className="text-2xl font-bold text-green-600">{activePackages}</div>
          </div>
        </div>
      </div>

      {/* Popular Packages */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <span className="text-yellow-600 text-xl">⭐</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-500">Popular Packages</div>
            <div className="text-2xl font-bold text-yellow-600">{popularPackages}</div>
          </div>
        </div>
      </div>

      {/* Average Price */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <span className="text-purple-600 text-xl">💰</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-500">Average Price</div>
            <div className="text-2xl font-bold text-purple-600">
              ${averagePrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
