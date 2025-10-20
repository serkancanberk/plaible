import React, { useState, useEffect, useCallback } from 'react';
import { PackageStats } from '../components/PackageStats';
import { PackageTable } from '../components/PackageTable';
import { PackageForm, CreatePackageData, UpdatePackageData } from '../components/PackageForm';
import { useToast } from '../components/Toast';
import { adminApi, Package } from '../api';

export const PackageManagerPage: React.FC = () => {
  // State management
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const { showToast } = useToast();

  // Load packages on mount
  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[PACKAGE_UI][LOAD] Fetching packages...');
      const response = await adminApi.packages.getAll();
      
      if (response.ok) {
        setPackages(response.packages);
        console.log('[PACKAGE_UI][LOAD] Packages loaded successfully:', response.packages.length);
      } else {
        throw new Error('Failed to load packages');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load packages';
      setError(errorMessage);
      console.error('[PACKAGE_UI][LOAD] Error loading packages:', err);
      showToast('Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load packages on mount
  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Create package
  const handleCreatePackage = async (data: CreatePackageData) => {
    try {
      setFormLoading(true);
      
      console.log('[PACKAGE_UI][FORM_SUBMIT] Creating package:', data);
      const response = await adminApi.packages.create(data);
      
      if (response.ok) {
        setPackages(prev => [...prev, response.package]);
        showToast('Package created successfully', 'success');
        setIsCreateModalOpen(false);
        console.log('[PACKAGE_UI][FORM_SUBMIT] Package created successfully');
      } else {
        throw new Error('Failed to create package');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create package';
      console.error('[PACKAGE_UI][FORM_SUBMIT] Error creating package:', err);
      showToast(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Update package
  const handleUpdatePackage = async (data: UpdatePackageData) => {
    if (!editingPackage) return;
    
    try {
      setFormLoading(true);
      
      console.log('[PACKAGE_UI][FORM_SUBMIT] Updating package:', editingPackage._id, data);
      const response = await adminApi.packages.update(editingPackage._id, data);
      
      if (response.ok) {
        setPackages(prev => prev.map(p => p._id === editingPackage._id ? response.package : p));
        showToast('Package updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingPackage(null);
        console.log('[PACKAGE_UI][FORM_SUBMIT] Package updated successfully');
      } else {
        throw new Error('Failed to update package');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update package';
      console.error('[PACKAGE_UI][FORM_SUBMIT] Error updating package:', err);
      showToast(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete package
  const handleDeletePackage = async (id: string) => {
    try {
      console.log('[PACKAGE_UI][DELETE] Deleting package:', id);
      const response = await adminApi.packages.delete(id);
      
      if (response.ok) {
        setPackages(prev => prev.filter(p => p._id !== id));
        showToast('Package deleted successfully', 'success');
        console.log('[PACKAGE_UI][DELETE] Package deleted successfully');
      } else {
        throw new Error('Failed to delete package');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete package';
      console.error('[PACKAGE_UI][DELETE] Error deleting package:', err);
      showToast(errorMessage, 'error');
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      console.log('[PACKAGE_UI][TOGGLE] Toggling package active status:', id, isActive);
      const response = await adminApi.packages.update(id, { isActive });
      
      if (response.ok) {
        setPackages(prev => prev.map(p => p._id === id ? response.package : p));
        showToast(`Package ${isActive ? 'activated' : 'deactivated'}`, 'success');
        console.log('[PACKAGE_UI][TOGGLE] Package status updated successfully');
      } else {
        throw new Error('Failed to update package status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update package status';
      console.error('[PACKAGE_UI][TOGGLE] Error updating package status:', err);
      showToast(errorMessage, 'error');
    }
  };

  // Edit package
  const handleEditPackage = (packageData: Package) => {
    setEditingPackage(packageData);
    setIsEditModalOpen(true);
  };

  // Close modals
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPackage(null);
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Package Manager</h1>
            <p className="text-gray-600 mt-1">Manage available credits packages, pricing, and bonuses.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            + Add Package
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={loadPackages}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <PackageStats packages={packages} loading={loading} />

      {/* Package Table */}
      <PackageTable
        packages={packages}
        loading={loading}
        onEdit={handleEditPackage}
        onDelete={handleDeletePackage}
        onToggleActive={handleToggleActive}
      />

      {/* Create Package Modal */}
      <PackageForm
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreatePackage}
        loading={formLoading}
      />

      {/* Edit Package Modal */}
      <PackageForm
        package={editingPackage}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdatePackage}
        loading={formLoading}
      />
    </div>
  );
};
