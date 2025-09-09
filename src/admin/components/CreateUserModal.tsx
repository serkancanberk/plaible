// src/admin/components/CreateUserModal.tsx
import React, { useState } from 'react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (userData: CreateUserData) => Promise<void>;
}

interface CreateUserData {
  displayName: string;
  email: string;
  roles: string[];
  status: 'active' | 'disabled';
  walletBalance: number;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onCreateUser
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    displayName: '',
    email: '',
    roles: ['user'],
    status: 'active',
    walletBalance: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserData>>({});

  const generateRandomUser = () => {
    const randomId = Math.floor(Math.random() * 1000);
    const timestamp = Date.now();
    
    setFormData({
      displayName: `User ${randomId}`,
      email: `user${timestamp}@example.com`,
      roles: Math.random() > 0.5 ? ['admin'] : ['user'],
      status: Math.random() > 0.5 ? 'active' : 'disabled',
      walletBalance: Math.floor(Math.random() * 1000)
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserData> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role is required';
    }

    if (formData.walletBalance < 0) {
      newErrors.walletBalance = 'Wallet balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onCreateUser(formData);
      // Reset form on success
      setFormData({
        displayName: '',
        email: '',
        roles: ['user'],
        status: 'active',
        walletBalance: 0
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      displayName: '',
      email: '',
      roles: ['user'],
      status: 'active',
      walletBalance: 0
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter display name"
            />
            {errors.displayName && (
              <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Roles */}
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Roles *
            </label>
            <select
              id="roles"
              value={formData.roles[0] || 'user'}
              onChange={(e) => setFormData(prev => ({ ...prev, roles: [e.target.value] }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roles ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.roles && (
              <p className="text-red-500 text-xs mt-1">{errors.roles}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'disabled' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          {/* Wallet Balance */}
          <div>
            <label htmlFor="walletBalance" className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Balance
            </label>
            <input
              type="number"
              id="walletBalance"
              min="0"
              step="1"
              value={formData.walletBalance}
              onChange={(e) => setFormData(prev => ({ ...prev, walletBalance: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.walletBalance ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter credits (e.g., 100)"
            />
            {errors.walletBalance && (
              <p className="text-red-500 text-xs mt-1">{errors.walletBalance}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={generateRandomUser}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              🎲 Generate Random User
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ❌ Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Creating...' : '➕ Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
