// src/admin/components/categoryManager/MainCategoryEditor.tsx
import React, { useState } from 'react';
import { CategoryConfigItem, I18nLabel } from '../../../config/categoryConfig';
import { SubCategoryEditor } from './SubCategoryEditor';
import { SupportedLanguage } from '../../pages/CategoryManagerPage';

interface MainCategoryEditorProps {
  mainCategory: CategoryConfigItem;
  index: number;
  currentLanguage: SupportedLanguage;
  getLabel: (label: I18nLabel, fallback?: string) => string;
  onUpdate: (updatedMainCategory: CategoryConfigItem) => void;
  onDelete: () => void;
}

export const MainCategoryEditor: React.FC<MainCategoryEditorProps> = ({
  mainCategory,
  index,
  currentLanguage,
  getLabel,
  onUpdate,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(getLabel(mainCategory.label));

  const handleSave = () => {
    if (editValue.trim() && editValue !== getLabel(mainCategory.label)) {
      onUpdate({
        ...mainCategory,
        label: {
          ...mainCategory.label,
          [currentLanguage]: editValue.trim()
        }
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(getLabel(mainCategory.label));
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const totalSubCategories = mainCategory.subCategories.length;
  const totalGenres = mainCategory.subCategories.reduce((sum, sub) => sum + sub.genres.length, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSave}
                className="text-lg font-semibold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">
                {getLabel(mainCategory.label)}
                {currentLanguage !== 'en' && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({getLabel(mainCategory.label, 'en')})
                  </span>
                )}
              </h3>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{totalSubCategories} subcategories</span>
              <span>•</span>
              <span>{totalGenres} genres</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit main category"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete main category"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-4">
            {mainCategory.subCategories.map((subCategory, subIndex) => (
              <SubCategoryEditor
                key={`${subCategory.value}-${subIndex}`}
                subCategory={subCategory}
                subIndex={subIndex}
                currentLanguage={currentLanguage}
                getLabel={getLabel}
                onUpdate={(updatedSubCategory) => {
                  const updatedSubCategories = [...mainCategory.subCategories];
                  updatedSubCategories[subIndex] = updatedSubCategory;
                  onUpdate({
                    ...mainCategory,
                    subCategories: updatedSubCategories
                  });
                }}
                onDelete={() => {
                  const updatedSubCategories = mainCategory.subCategories.filter((_, i) => i !== subIndex);
                  onUpdate({
                    ...mainCategory,
                    subCategories: updatedSubCategories
                  });
                }}
              />
            ))}
            
            {/* Add Sub Category Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  const newSubCategory = {
                    label: { en: 'New Subcategory', tr: 'Yeni Alt Kategori' },
                    value: 'new-subcategory',
                    genres: []
                  };
                  onUpdate({
                    ...mainCategory,
                    subCategories: [...mainCategory.subCategories, newSubCategory]
                  });
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-dashed border-gray-300 hover:border-blue-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Subcategory</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
