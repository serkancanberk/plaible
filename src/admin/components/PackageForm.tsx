import React, { useState, useEffect } from 'react';
import { Package } from './PackageStats';

export interface CreatePackageData {
  name: string;
  credits: number;
  price: number;
  bonus?: number;
  description?: string;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  isActive?: boolean;
}

interface PackageFormProps {
  package?: Package;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePackageData | UpdatePackageData) => void;
  loading?: boolean;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  package: packageData,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const isEdit = !!packageData;
  
  const [formData, setFormData] = useState<CreatePackageData>({
    name: '',
    credits: 0,
    price: 0,
    bonus: 0,
    description: '',
    isPopular: false,
    isActive: true,
    sortOrder: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when package changes
  useEffect(() => {
    if (packageData) {
      setFormData({
        name: packageData.name,
        credits: packageData.credits,
        price: packageData.price,
        bonus: packageData.bonus,
        description: packageData.description || '',
        isPopular: packageData.isPopular,
        isActive: packageData.isActive,
        sortOrder: packageData.sortOrder
      });
    } else {
      setFormData({
        name: '',
        credits: 0,
        price: 0,
        bonus: 0,
        description: '',
        isPopular: false,
        isActive: true,
        sortOrder: 0
      });
    }
    setErrors({});
  }, [packageData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    }

    if (formData.credits <= 0) {
      newErrors.credits = 'Credits must be greater than 0';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.bonus < 0) {
      newErrors.bonus = 'Bonus cannot be negative';
    }

    if (formData.bonus > formData.credits) {
      newErrors.bonus = 'Bonus cannot exceed base credits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('[PACKAGE_UI][FORM_SUBMIT] Submitting package form:', {
      isEdit,
      packageId: packageData?._id,
      formData
    });

    onSubmit(formData);
  };

  const handleChange = (field: keyof CreatePackageData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEdit ? 'Edit Package' : 'Create Package'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Package Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Starter, Pro, Elite"
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Credits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Credits *
              </label>
              <input
                type="number"
                min="1"
                value={formData.credits}
                onChange={(e) => handleChange('credits', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.credits ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.credits && (
                <p className="text-red-500 text-xs mt-1">{errors.credits}</p>
              )}
            </div>

            {/* Bonus Credits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus Credits
              </label>
              <input
                type="number"
                min="0"
                value={formData.bonus}
                onChange={(e) => handleChange('bonus', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bonus ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.bonus && (
                <p className="text-red-500 text-xs mt-1">{errors.bonus}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Total Credits: {formData.credits + (formData.bonus || 0)}
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description for this package"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">
                Lower numbers appear first
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => handleChange('isPopular', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700">
                  Mark as Popular
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Package' : 'Create Package')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
