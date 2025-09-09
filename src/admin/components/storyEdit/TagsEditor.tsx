// src/admin/components/storyEdit/TagsEditor.tsx
import React, { useState } from 'react';
import { Story } from '../../api';

interface TagsEditorProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const TagsEditor: React.FC<TagsEditorProps> = ({ story, onUpdate }) => {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !story.tags.includes(newTag.trim())) {
      onUpdate({
        tags: [...story.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate({
      tags: story.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleBulkImport = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const uniqueTags = [...new Set([...story.tags, ...tags])];
    onUpdate({ tags: uniqueTags });
  };

  // Common tag suggestions
  const commonTags = [
    'Drama', 'Romance', 'Mystery', 'Thriller', 'Fantasy', 'Sci-Fi', 'Horror',
    'Comedy', 'Adventure', 'Historical', 'Contemporary', 'Young Adult',
    'Classic', 'Literary', 'Action', 'Suspense', 'Family', 'Friendship',
    'Coming of Age', 'Love Story', 'Crime', 'Detective', 'Supernatural',
    'Time Travel', 'Dystopian', 'Utopian', 'Philosophical', 'Psychological'
  ];

  const addSuggestedTag = (tag: string) => {
    if (!story.tags.includes(tag)) {
      onUpdate({
        tags: [...story.tags, tag]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🏷️ Tags Management</h2>
        <p className="text-sm text-gray-600 mb-6">Add and manage tags to help users discover this story.</p>
      </div>

      {/* Current Tags */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Tags</h3>
        
        {story.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No tags added yet.</p>
        )}
      </div>

      {/* Add New Tag */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Tag</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a new tag..."
          />
          <button
            onClick={addTag}
            disabled={!newTag.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Press Enter or click Add to add the tag.</p>
      </div>

      {/* Bulk Import */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import Tags</h3>
        
        <div>
          <textarea
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter multiple tags separated by commas:&#10;Drama, Romance, Mystery, Thriller"
            onChange={(e) => handleBulkImport(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter multiple tags separated by commas. Duplicate tags will be automatically filtered out.
          </p>
        </div>
      </div>

      {/* Suggested Tags */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Suggested Tags</h3>
        <p className="text-sm text-gray-600 mb-4">Click on any tag below to add it to your story.</p>
        
        <div className="flex flex-wrap gap-2">
          {commonTags.map((tag) => (
            <button
              key={tag}
              onClick={() => addSuggestedTag(tag)}
              disabled={story.tags.includes(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                story.tags.includes(tag)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📝 Tag Guidelines</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Genre Tags:</strong> Use broad genre categories like "Drama", "Romance", "Mystery" to help with discovery.</p>
          <p><strong>Theme Tags:</strong> Add thematic tags like "Coming of Age", "Friendship", "Family" to highlight story themes.</p>
          <p><strong>Style Tags:</strong> Include style indicators like "Classic", "Contemporary", "Literary" to set expectations.</p>
          <p><strong>Content Tags:</strong> Use content descriptors like "Young Adult", "Historical" to indicate target audience.</p>
          <p><strong>Best Practice:</strong> Aim for 5-15 relevant tags that accurately describe your story without being too specific.</p>
        </div>
      </div>

      {/* Tag Statistics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tag Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {story.tags.length}
            </div>
            <div className="text-sm text-gray-600">Total Tags</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {story.tags.filter(tag => commonTags.includes(tag)).length}
            </div>
            <div className="text-sm text-gray-600">Common Tags</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {story.tags.filter(tag => !commonTags.includes(tag)).length}
            </div>
            <div className="text-sm text-gray-600">Custom Tags</div>
          </div>
        </div>
      </div>
    </div>
  );
};
