// src/admin/components/storyEdit/BasicInfoForm.tsx
import React from 'react';
import { Story } from '../../api';

interface BasicInfoFormProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ story, onUpdate }) => {
  const handleInputChange = (field: keyof Story, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleArrayChange = (field: keyof Story, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    onUpdate({ [field]: array });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📌 Basic Information</h2>
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
            value={story.mainCategory}
            onChange={(e) => handleInputChange('mainCategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Book">Book</option>
            <option value="Story">Story</option>
            <option value="Biography">Biography</option>
          </select>
        </div>

        {/* Sub Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub Category
          </label>
          <input
            type="text"
            value={story.subCategory || ''}
            onChange={(e) => handleInputChange('subCategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Fiction, Non-fiction"
          />
        </div>

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genres
          </label>
          <input
            type="text"
            value={story.genres.join(', ')}
            onChange={(e) => handleArrayChange('genres', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Drama, Romance, Mystery"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple genres with commas</p>
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
    </div>
  );
};
