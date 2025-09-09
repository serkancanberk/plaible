// src/admin/components/EditUserModal.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../api';

interface Props {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updatedFields: any) => Promise<void>;
}

export const EditUserModal: React.FC<Props> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    roles: [] as string[],
    status: 'active' as 'active' | 'disabled'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; roles?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      const initialData = {
        displayName: user.displayName || '',
        email: user.email || '',
        roles: user.roles || [],
        status: user.status || 'active'
      };
      setFormData(initialData);
      setHasChanges(false);
      setErrors({});
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (user) {
      const hasFormChanges = 
        formData.displayName !== (user.displayName || '') ||
        JSON.stringify(formData.roles.sort()) !== JSON.stringify((user.roles || []).sort()) ||
        formData.status !== (user.status || 'active');
      setHasChanges(hasFormChanges);
    }
  }, [formData, user]);

  // Validation
  const validateForm = () => {
    const newErrors: { displayName?: string; roles?: string } = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Exclude email from update payload
      const { email, ...updateData } = formData;
      await onSave(user._id, updateData);
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className={`w-full border rounded px-3 py-2 ${errors.displayName ? 'border-red-500' : ''}`}
              required
            />
            {errors.displayName && (
              <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              readOnly
            />
            <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            <div className="space-y-2">
              {['admin', 'moderator', 'user'].map(role => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => handleRoleChange(role, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
            {errors.roles && (
              <p className="text-red-500 text-xs mt-1">{errors.roles}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'disabled' }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !hasChanges || Object.keys(errors).length > 0}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
