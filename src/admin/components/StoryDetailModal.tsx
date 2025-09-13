// src/admin/components/StoryDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { adminApi, Story } from '../api';
import { Spinner } from './Spinner';
import { useToast } from './Toast';

interface StoryDetailModalProps {
  storyId: string;
  onClose: () => void;
}

interface EditableStoryData {
  title: string;
  isActive: boolean;
  tags: string;
  storyPrompt: string;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({ storyId, onClose }) => {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<EditableStoryData>({
    title: '',
    isActive: false,
    tags: '',
    storyPrompt: ''
  });
  const { showToast } = useToast();

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getStory(storyId);
        
        if (response.ok && response.story) {
          setStory(response.story);
          setEditableData({
            title: response.story.title,
            isActive: response.story.isActive,
            tags: response.story.tags.join(', '),
            storyPrompt: response.story.storyrunner?.storyPrompt || response.story.storyrunner?.systemPrompt || ''
          });
        } else {
          setError('Failed to load story');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  // Handle save changes
  const handleSave = async () => {
    if (!story) return;

    try {
      setSaving(true);
      const updateData = {
        title: editableData.title,
        isActive: editableData.isActive,
        tags: editableData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        storyrunner: {
          ...story.storyrunner,
          storyPrompt: editableData.storyPrompt
        }
      };

      const response = await adminApi.updateStory(storyId, updateData);
      
      if (response.ok) {
        showToast('Story updated successfully', 'success');
        setIsEditing(false);
        // Reload story data
        const updatedResponse = await adminApi.getStory(storyId);
        if (updatedResponse.ok && updatedResponse.story) {
          setStory(updatedResponse.story);
        }
      } else {
        showToast('Failed to update story', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update story', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    if (story) {
      setEditableData({
        title: story.title,
        isActive: story.isActive,
        tags: story.tags.join(', '),
        storyPrompt: story.storyrunner?.storyPrompt || story.storyrunner?.systemPrompt || ''
      });
    }
    setIsEditing(false);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render collapsible section
  const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ 
    title, 
    children, 
    defaultOpen = false 
  }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
        >
          <span className="font-medium text-gray-900">{title}</span>
          <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {isOpen && (
          <div className="p-4 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Spinner />
            <span className="ml-3 text-gray-600">Loading story details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Story</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Story' : 'Story Details'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">ID: {story._id}</p>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving && <Spinner />}
                  <span className={saving ? 'ml-2' : ''}>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableData.title}
                  onChange={(e) => setEditableData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{story.title}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
              <p className="text-gray-600 font-mono text-sm">{story.slug}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <p className="text-gray-900">{story.mainCategory} {story.subCategory && `- ${story.subCategory}`}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <p className="text-gray-900">{story.authorName || 'Unknown'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <p className="text-gray-900">{story.language}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Rating</label>
              <p className="text-gray-900">{story.contentRating}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              {isEditing ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editableData.isActive}
                    onChange={(e) => setEditableData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Active</span>
                </label>
              ) : (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  story.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {story.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableData.tags}
                  onChange={(e) => setEditableData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {story.tags.map((tag, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {story.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900">{story.description}</p>
            </div>
          )}

          {/* Summary */}
          <CollapsibleSection title="Summary" defaultOpen>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Original Summary</h4>
                <p className="text-gray-700 text-sm">{story.summary.original}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Modern Summary</h4>
                <p className="text-gray-700 text-sm">{story.summary.modern}</p>
              </div>
              {story.summary.highlights.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Highlights</h4>
                  <div className="space-y-2">
                    {story.summary.highlights.map((highlight, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <h5 className="font-medium text-gray-900">{highlight.title}</h5>
                        <p className="text-gray-700 text-sm">{highlight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Characters */}
          {story.characters.length > 0 && (
            <CollapsibleSection title={`Characters (${story.characters.length})`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {story.characters.map((character, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{character.name}</h4>
                    <p className="text-gray-700 text-sm mb-2">{character.summary}</p>
                    {character.hooks.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Hooks:</h5>
                        <ul className="text-sm text-gray-600">
                          {character.hooks.map((hook, hookIndex) => (
                            <li key={hookIndex}>• {hook}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Storyrunner Configuration */}
          <CollapsibleSection title="AI Storyrunner Configuration">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                {isEditing ? (
                  <textarea
                    value={editableData.storyPrompt}
                    onChange={(e) => setEditableData(prev => ({ ...prev, storyPrompt: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the AI system prompt..."
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{story.storyrunner?.storyPrompt || story.storyrunner?.systemPrompt || 'No prompt configured'}</p>
                  </div>
                )}
              </div>
              {(story.storyrunner?.openingBeats?.length || 0) > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Opening Beats</h4>
                  <ul className="space-y-1">
                    {(story.storyrunner?.openingBeats || []).map((beat, index) => (
                      <li key={index} className="text-gray-700 text-sm">• {beat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Credits per Chapter</h4>
                <p className="text-2xl font-bold text-blue-600">{story.pricing.creditsPerChapter}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Estimated Chapters</h4>
                <p className="text-2xl font-bold text-blue-600">{story.pricing.estimatedChapterCount}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="font-medium text-gray-900">Total Played</h4>
                <p className="text-2xl font-bold text-green-600">{story.stats.totalPlayed}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="font-medium text-gray-900">Reviews</h4>
                <p className="text-2xl font-bold text-blue-600">{story.stats.totalReviews}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="font-medium text-gray-900">Avg Rating</h4>
                <p className="text-2xl font-bold text-yellow-600">{story.stats.avgRating.toFixed(1)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="font-medium text-gray-900">Saved</h4>
                <p className="text-2xl font-bold text-purple-600">{story.stats.savedCount}</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">{formatDate(story.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Updated:</span>
                <span className="ml-2 text-gray-600">{formatDate(story.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
