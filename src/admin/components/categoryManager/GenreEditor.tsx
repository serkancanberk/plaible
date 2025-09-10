// src/admin/components/categoryManager/GenreEditor.tsx
import React, { useState } from 'react';
import { GenreItem, I18nLabel } from '../../../config/categoryConfig';
import { SupportedLanguage } from '../../pages/CategoryManagerPage';

interface GenreEditorProps {
  genre: GenreItem;
  genreIndex: number;
  currentLanguage: SupportedLanguage;
  getLabel: (label: I18nLabel, fallback?: string) => string;
  onUpdate: (updatedGenre: GenreItem) => void;
  onDelete: () => void;
}

export const GenreEditor: React.FC<GenreEditorProps> = ({
  genre,
  genreIndex,
  currentLanguage,
  getLabel,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(getLabel(genre.label));

  const handleSave = () => {
    if (editValue.trim() && editValue !== getLabel(genre.label)) {
      onUpdate({
        ...genre,
        label: {
          ...genre.label,
          [currentLanguage]: editValue.trim()
        }
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(getLabel(genre.label));
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSave}
            className="text-sm text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span className="text-sm text-gray-900 font-medium">
            {getLabel(genre.label)}
            {currentLanguage !== 'en' && (
              <span className="text-xs text-gray-500 ml-1">
                ({getLabel(genre.label, 'en')})
              </span>
            )}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit genre"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete genre"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
