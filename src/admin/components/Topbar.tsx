// src/admin/components/Topbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AdminProfile } from './AdminProfile';

interface TopbarProps {
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to App
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Admin Panel</span>
            <AdminProfile />
          </div>
        </div>
      </div>
    </div>
  );
};
