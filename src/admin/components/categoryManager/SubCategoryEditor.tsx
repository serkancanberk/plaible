// src/admin/components/categoryManager/SubCategoryEditor.tsx
import React, { useState } from 'react';
import { GenreEditor } from './GenreEditor';
import { SubCategoryItem, I18nLabel } from '../../../config/categoryConfig';
import { SupportedLanguage } from '../../pages/CategoryManagerPage';

interface SubCategoryEditorProps {
  subCategory: SubCategoryItem;
  subIndex: number;
  currentLanguage: SupportedLanguage;
  getLabel: (label: I18nLabel, fallback?: string) => string;
  onUpdate: (updatedSubCategory: SubCategoryItem) => void;
  onDelete: () => void;
}

export const SubCategoryEditor: React.FC<SubCategoryEditorProps> = ({
  subCategory,
  subIndex,
  currentLanguage,
  getLabel,
  onUpdate,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(getLabel(subCategory.label));

  const handleSave = () => {
    if (editValue.trim() && editValue !== getLabel(subCategory.label)) {
      onUpdate({
        ...subCategory,
        label: {
          ...subCategory.label,
          [currentLanguage]: editValue.trim()
        }
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(getLabel(subCategory.label));
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const totalGenres = subCategory.genres.length;
  const isEmpty = totalGenres === 0;

  return (
    <div className={`border rounded-lg ${isEmpty ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
                className="font-medium text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h4 className="font-medium text-gray-900">
                {getLabel(subCategory.label)}
                {currentLanguage !== 'en' && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({getLabel(subCategory.label, 'en')})
                  </span>
                )}
              </h4>
            )}
            
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-2 py-1 rounded-full ${
                isEmpty 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {totalGenres} genres
              </span>
              {isEmpty && (
                <span className="text-xs text-orange-600 font-medium">
                  ⚠️ Empty
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit subcategory"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete subcategory"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="space-y-2">
            {subCategory.genres.map((genre, genreIndex) => (
              <GenreEditor
                key={`${genre.value}-${genreIndex}`}
                genre={genre}
                genreIndex={genreIndex}
                currentLanguage={currentLanguage}
                getLabel={getLabel}
                onUpdate={(updatedGenre) => {
                  const updatedGenres = [...subCategory.genres];
                  updatedGenres[genreIndex] = updatedGenre;
                  onUpdate({
                    ...subCategory,
                    genres: updatedGenres
                  });
                }}
                onDelete={() => {
                  const updatedGenres = subCategory.genres.filter((_, i) => i !== genreIndex);
                  onUpdate({
                    ...subCategory,
                    genres: updatedGenres
                  });
                }}
              />
            ))}
            
            {/* Add Genre Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  const newGenre = {
                    label: { en: 'New Genre', tr: 'Yeni Tür' },
                    value: 'new-genre'
                  };
                  onUpdate({
                    ...subCategory,
                    genres: [...subCategory.genres, newGenre]
                  });
                }}
                className="flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded border border-dashed border-gray-300 hover:border-blue-300"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Genre</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
