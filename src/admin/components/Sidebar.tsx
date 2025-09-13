// src/admin/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/stories', label: 'Stories', icon: '📚' },
  { path: '/feedbacks', label: 'Feedbacks', icon: '💬' },
  { path: '/wallet-analytics', label: 'Wallet Analytics', icon: '💰' },
  { path: '/category-manager', label: 'Category Manager', icon: '🏷️' },
  { path: '/storyrunner', label: 'StoryRunner AI', icon: '🎭' },
];

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  return (
    <div className={`w-64 bg-gray-800 text-white min-h-screen ${className}`}>
      <div className="p-6">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
