// src/admin/components/storyEdit/BasicInfoForm.tsx
import React, { useState, useEffect } from 'react';
import { Story } from '../../api';
import { categoryConfig, CategoryConfigItem, I18nLabel } from '../../../config/categoryConfig';

interface BasicInfoFormProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

type SupportedLanguage = 'en' | 'tr';

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ story, onUpdate }) => {
  const [availableSubCategories, setAvailableSubCategories] = useState<Array<{label: I18nLabel, value: string, genres: Array<{label: I18nLabel, value: string}>}>>([]);
  const [availableGenres, setAvailableGenres] = useState<Array<{label: I18nLabel, value: string}>>([]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  // Helper function to get label in current language
  const getLabel = (label: I18nLabel, fallback?: string): string => {
    return label[currentLanguage] || label.en || fallback || 'Untitled';
  };

  // Update available subcategories when mainCategory changes
  useEffect(() => {
    const selectedMainCategory = categoryConfig.find(cat => cat.value === story.mainCategory);
    if (selectedMainCategory) {
      setAvailableSubCategories(selectedMainCategory.subCategories);
    } else {
      setAvailableSubCategories([]);
    }
  }, [story.mainCategory]);

  // Update available genres when subCategory changes
  useEffect(() => {
    const selectedSubCategory = availableSubCategories.find(sub => sub.value === story.subCategory);
    if (selectedSubCategory) {
      setAvailableGenres(selectedSubCategory.genres);
    } else {
      setAvailableGenres([]);
    }
  }, [story.subCategory, availableSubCategories]);

  const handleInputChange = (field: keyof Story, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleArrayChange = (field: keyof Story, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    onUpdate({ [field]: array });
  };

  const handleMainCategoryChange = (value: string) => {
    // Reset subCategory and genres when mainCategory changes
    onUpdate({ 
      mainCategory: value, 
      subCategory: '', 
      genres: [] 
    });
  };

  const handleSubCategoryChange = (value: string) => {
    // Reset genres when subCategory changes
    onUpdate({ 
      subCategory: value, 
      genres: [] 
    });
  };

  const handleGenreToggle = (genre: string) => {
    const currentGenres = story.genres || [];
    const updatedGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    
    onUpdate({ genres: updatedGenres });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">📌 Basic Information</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Language:</span>
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value as SupportedLanguage)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">Configure the core story metadata and publishing details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={story.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter story title"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug *
          </label>
          <input
            type="text"
            value={story.slug}
            onChange={(e) => handleInputChange('slug', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="story-slug"
          />
          <p className="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
        </div>

        {/* Author Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author Name
          </label>
          <input
            type="text"
            value={story.authorName || ''}
            onChange={(e) => handleInputChange('authorName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Author name"
          />
        </div>

        {/* Main Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Category *
          </label>
          <select
            value={story.mainCategory || ''}
            onChange={(e) => handleMainCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a main category...</option>
            {categoryConfig.map((category) => (
              <option key={category.value} value={category.value}>
                {getLabel(category.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub Category
          </label>
          <select
            value={story.subCategory || ''}
            onChange={(e) => handleSubCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={availableSubCategories.length === 0}
          >
            <option value="">Select a subcategory...</option>
            {availableSubCategories.map((subCategory) => (
              <option key={subCategory.value} value={subCategory.value}>
                {getLabel(subCategory.label)}
              </option>
            ))}
          </select>
          {availableSubCategories.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">Please select a main category first</p>
          )}
        </div>

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genres
          </label>
          {availableGenres.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableGenres.map((genre) => {
                  const isSelected = story.genres?.includes(genre.value) || false;
                  return (
                    <button
                      key={genre.value}
                      type="button"
                      onClick={() => handleGenreToggle(genre.value)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getLabel(genre.label)}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                Click to select/deselect genres. Selected: {story.genres?.length || 0}
              </p>
            </div>
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
              Please select a subcategory to see available genres
            </div>
          )}
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <input
            type="text"
            value={story.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="en"
          />
        </div>

        {/* License */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License
          </label>
          <input
            type="text"
            value={story.license}
            onChange={(e) => handleInputChange('license', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Public Domain"
          />
        </div>

        {/* Published Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Published Year
          </label>
          <input
            type="number"
            value={story.publishedYear || ''}
            onChange={(e) => handleInputChange('publishedYear', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1890"
            min="0"
          />
        </div>

        {/* Published Era */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Published Era
          </label>
          <input
            type="text"
            value={story.publishedEra || ''}
            onChange={(e) => handleInputChange('publishedEra', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Victorian Era"
          />
        </div>

        {/* Publisher */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Publisher
          </label>
          <input
            type="text"
            value={story.publisher || ''}
            onChange={(e) => handleInputChange('publisher', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Publisher name"
          />
        </div>

        {/* Content Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Rating
          </label>
          <select
            value={story.contentRating}
            onChange={(e) => handleInputChange('contentRating', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="G">G - General Audiences</option>
            <option value="PG">PG - Parental Guidance</option>
            <option value="13+">13+ - Teen</option>
            <option value="16+">16+ - Mature Teen</option>
            <option value="18+">18+ - Adult</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={story.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active (visible to users)
            </label>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Headline
        </label>
        <input
          type="text"
          value={story.headline || ''}
          onChange={(e) => handleInputChange('headline', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Catchy headline for the story"
        />
        <p className="text-xs text-gray-500 mt-1">Short, attention-grabbing headline</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={story.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description of the story..."
        />
      </div>
    </div>
  );
};
