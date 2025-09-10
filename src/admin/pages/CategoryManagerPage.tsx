// src/admin/pages/CategoryManagerPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { categoryConfig, CategoryConfigItem, I18nLabel } from '../../config/categoryConfig';
import { useToast } from '../components/Toast';
import { MainCategoryEditor } from '../components/categoryManager/MainCategoryEditor';
import { ConfigPreviewPanel } from '../components/categoryManager/ConfigPreviewPanel';

export type SupportedLanguage = 'en' | 'tr';

export const CategoryManagerPage: React.FC = () => {
  const [config, setConfig] = useState<CategoryConfigItem[]>([]);
  const [originalConfig, setOriginalConfig] = useState<CategoryConfigItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Load initial configuration
  useEffect(() => {
    const initialConfig = [...categoryConfig];
    setConfig(initialConfig);
    setOriginalConfig(initialConfig);
  }, []);

  // Check for changes
  useEffect(() => {
    const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(hasChanges);
  }, [config, originalConfig]);

  const handleConfigUpdate = (updatedConfig: CategoryConfigItem[]) => {
    setConfig(updatedConfig);
  };

  const handleSave = () => {
    // Mock save functionality
    showToast('Configuration saved successfully! (Mock save)', 'success');
    setOriginalConfig([...config]);
    setHasChanges(false);
  };

  const handleSaveToBackend = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/category-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showToast('Configuration saved to backend successfully!', 'success');
        setOriginalConfig([...config]);
        setHasChanges(false);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
      showToast('Failed to save configuration to backend', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    setConfig([...originalConfig]);
    setHasChanges(false);
    showToast('Changes reverted to original configuration', 'info');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'categoryConfig.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Configuration exported successfully!', 'success');
  };

  const handleImport = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Importing will overwrite them. Continue?')) {
        return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!Array.isArray(importedConfig)) {
          throw new Error('Invalid configuration format');
        }

        setConfig(importedConfig);
        showToast('Configuration imported successfully!', 'success');
      } catch (error) {
        console.error('Error importing configuration:', error);
        showToast('Failed to import configuration. Please check the file format.', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddMainCategory = () => {
    const newMainCategory: CategoryConfigItem = {
      label: { en: 'New Category', tr: 'Yeni Kategori' },
      value: 'new-category',
      subCategories: []
    };
    setConfig([...config, newMainCategory]);
  };

  const handleDeleteMainCategory = (index: number) => {
    const updatedConfig = config.filter((_, i) => i !== index);
    setConfig(updatedConfig);
  };

  const getLabel = (label: I18nLabel, fallback?: string): string => {
    return label[currentLanguage] || label.en || fallback || 'Untitled';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Manager</h1>
            <p className="text-gray-600">
              Manage the hierarchical structure of main categories, subcategories, and genres used throughout the Stories system.
            </p>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Language:</span>
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value as SupportedLanguage)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes (Mock)
            </button>
            <button
              onClick={handleSaveToBackend}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Save to Backend
            </button>
            <button
              onClick={handleRevert}
              disabled={!hasChanges}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revert
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Tools Section */}
            <div className="flex items-center space-x-2 border-l pl-4">
              <span className="text-sm text-gray-600 font-medium">Tools:</span>
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                Export JSON
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
              >
                Import JSON
              </button>
            </div>
            
            {hasChanges && (
              <span className="text-sm text-orange-600 font-medium">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleAddMainCategory}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Main Category
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Configuration Preview */}
      {showPreview && (
        <ConfigPreviewPanel config={config} />
      )}

      {/* Main Categories */}
      <div className="space-y-4">
        {config.map((mainCategory, index) => (
          <MainCategoryEditor
            key={`${mainCategory.value}-${index}`}
            mainCategory={mainCategory}
            index={index}
            currentLanguage={currentLanguage}
            getLabel={getLabel}
            onUpdate={(updatedMainCategory) => {
              const updatedConfig = [...config];
              updatedConfig[index] = updatedMainCategory;
              handleConfigUpdate(updatedConfig);
            }}
            onDelete={() => handleDeleteMainCategory(index)}
          />
        ))}
      </div>

      {/* Empty State */}
      {config.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first main category.</p>
          <button
            onClick={handleAddMainCategory}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add Main Category
          </button>
        </div>
      )}
    </div>
  );
};
