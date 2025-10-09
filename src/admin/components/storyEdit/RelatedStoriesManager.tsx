// src/admin/components/storyEdit/RelatedStoriesManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Story, adminApi } from '../../api';
import { useToast } from '../Toast';
import { motion } from 'framer-motion';
import { PlusCircle, CheckCircle } from 'lucide-react';

interface RelatedStoriesManagerProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

interface SearchResultStory extends Story {
  alreadyRelated?: boolean;
}

interface RelatedStoriesState {
  searchQuery: string;
  searchLoading: boolean;
  searchResults: SearchResultStory[];
  selectedStories: Story[];
  originalRelatedIds: string[];
  isFeatured: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  hasChanges: boolean;
  nextCursor?: string | null;
}

// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const RelatedStoriesManager: React.FC<RelatedStoriesManagerProps> = ({ 
  story, 
  onUpdate 
}) => {
  const { showToast } = useToast();
  
  const [state, setState] = useState<RelatedStoriesState>({
    searchQuery: '',
    searchLoading: false,
    searchResults: [],
    selectedStories: [],
    originalRelatedIds: story.relatedStoryIds || [],
    isFeatured: (story as any).featured || false,
    saving: false,
    error: null,
    success: null,
    hasChanges: false,
    nextCursor: null
  });

  const debouncedSearchQuery = useDebounce(state.searchQuery, 300);

  // Load related stories on mount
  useEffect(() => {
    const loadRelatedStories = async () => {
      if (story.relatedStoryIds && story.relatedStoryIds.length > 0) {
        try {
          // Fetch details for related stories
          const relatedStories: Story[] = [];
          for (const id of story.relatedStoryIds) {
            try {
              const response = await adminApi.getStory(id);
              if (response.ok && response.story) {
                relatedStories.push(response.story);
              }
            } catch (error) {
              console.warn(`Failed to load related story ${id}:`, error);
            }
          }
          
          setState(prev => ({
            ...prev,
            selectedStories: relatedStories,
            originalRelatedIds: story.relatedStoryIds
          }));
        } catch (error) {
          console.error('Failed to load related stories:', error);
        }
      }
    };

    loadRelatedStories();
  }, [story.relatedStoryIds]);

  // Optimize state updates: update searchResults when selectedStories changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      searchResults: prev.searchResults.map(result => ({
        ...result,
        alreadyRelated: state.selectedStories.some(sel => sel._id === result._id)
      }))
    }));
  }, [state.selectedStories]);

  // Search stories
  const searchStories = useCallback(async (query: string, cursor?: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, searchResults: [] }));
      return;
    }

    setState(prev => ({ ...prev, searchLoading: true }));
    
    try {
      const response = await adminApi.getStories({ 
        query: query.trim(), 
        limit: 10,
        cursor: cursor
      });

      if (response.ok && response.items) {
        // Filter out only the current story, but show already-related stories as disabled
        const filteredResults = response.items
          .filter(result => result._id !== story._id) // exclude only the current story
          .map(result => ({
            ...result,
            alreadyRelated: state.selectedStories.some(selected => selected._id === result._id)
          }));

        setState(prev => ({
          ...prev,
          searchResults: cursor ? [...prev.searchResults, ...filteredResults] : filteredResults,
          nextCursor: response.nextCursor,
          searchLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          searchResults: [],
          searchLoading: false,
          error: response.error || 'Failed to search stories'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        searchLoading: false,
        error: 'Failed to search stories'
      }));
    }
  }, [story._id, state.selectedStories]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchStories(debouncedSearchQuery);
    } else {
      setState(prev => ({ ...prev, searchResults: [] }));
    }
  }, [debouncedSearchQuery, searchStories]);

  // Add story to related
  const addStory = (storyToAdd: Story) => {
    if (state.selectedStories.some(s => s._id === storyToAdd._id)) {
      return; // Already added
    }

    setState(prev => ({
      ...prev,
      selectedStories: [...prev.selectedStories, storyToAdd],
      hasChanges: true,
      searchResults: prev.searchResults.filter(s => s._id !== storyToAdd._id)
    }));
  };

  // Remove story from related
  const removeStory = (storyId: string) => {
    setState(prev => ({
      ...prev,
      selectedStories: prev.selectedStories.filter(s => s._id !== storyId),
      hasChanges: true
    }));
  };

  // Handle featured toggle
  const handleFeaturedChange = (featured: boolean) => {
    setState(prev => ({
      ...prev,
      isFeatured: featured,
      hasChanges: true
    }));
  };

  // Save changes
  const handleSave = async () => {
    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      const response = await adminApi.updateStoryRelated(story._id, {
        relatedStoryIds: state.selectedStories.map(s => s._id),
        featured: state.isFeatured
      });

      if (response.ok) {
        // Update parent component
        onUpdate({
          relatedStoryIds: state.selectedStories.map(s => s._id),
          featured: state.isFeatured
        });

        setState(prev => ({
          ...prev,
          saving: false,
          hasChanges: false,
          originalRelatedIds: state.selectedStories.map(s => s._id),
          success: 'Related stories updated successfully'
        }));

        showToast('Related stories updated successfully', 'success');
      } else {
        setState(prev => ({
          ...prev,
          saving: false,
          error: response.message || 'Failed to update related stories'
        }));
        showToast(response.message || 'Failed to update related stories', 'error');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: 'Failed to update related stories'
      }));
      showToast('Failed to update related stories', 'error');
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setState(prev => ({
      ...prev,
      selectedStories: prev.selectedStories.filter(s => 
        prev.originalRelatedIds.includes(s._id)
      ),
      isFeatured: (story as any).featured || false,
      hasChanges: false,
      error: null,
      success: null
    }));
  };

  // Load more search results
  const loadMore = () => {
    if (state.nextCursor && state.searchQuery) {
      searchStories(state.searchQuery, state.nextCursor);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">🔗 Related Stories Management</h2>
        <p className="text-sm text-gray-600">Manage story relationships and featured recommendations</p>
      </div>

      {/* Search Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Search Stories</h3>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results */}
        {state.searchLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}

        {state.searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Search Results ({state.searchResults.length} found)
            </h4>
            {state.searchResults.map((result, index) => (
              <motion.div
                key={result._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  result.alreadyRelated
                    ? "bg-gray-50 border-gray-200 text-gray-400"
                    : "bg-white hover:bg-gray-50 border-gray-300"
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{result.title}</div>
                  <div className="text-sm text-gray-500">
                    {result.authorName} • {result.slug}
                  </div>
                </div>

                {result.alreadyRelated ? (
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Added</span>
                  </div>
                ) : (
                  <button
                    onClick={() => addStory(result)}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 hover:text-green-700 transition-colors"
                  >
                    <PlusCircle size={16} /> Add
                  </button>
                )}
              </motion.div>
            ))}
            
            {state.nextCursor && (
              <button
                onClick={loadMore}
                className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Load more results...
              </button>
            )}
          </div>
        )}

        {!state.searchLoading && state.searchQuery && state.searchResults.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No stories found matching "{state.searchQuery}"
          </div>
        )}

        {!state.searchQuery && (
          <div className="text-center py-4 text-gray-500">
            Type to search by title or slug...
          </div>
        )}
      </div>

      {/* Selected Stories Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📌 Related Stories ({state.selectedStories.length})
        </h3>

        {state.selectedStories.length > 0 ? (
          <div className="space-y-2">
            {state.selectedStories.map((selectedStory) => (
              <div key={selectedStory._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{selectedStory.title}</div>
                  <div className="text-sm text-gray-500">
                    {selectedStory.authorName} • {selectedStory.slug}
                  </div>
                </div>
                <button
                  onClick={() => removeStory(selectedStory._id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No related stories yet.
          </div>
        )}
      </div>

      {/* Featured Toggle */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            checked={state.isFeatured}
            onChange={(e) => handleFeaturedChange(e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-900">
            ⭐ Featured in "Want More" Section
          </label>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Mark as featured recommendation for users
        </p>
      </div>

      {/* Error/Success Messages */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-800">{state.error}</div>
        </div>
      )}

      {state.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="text-sm text-green-800">{state.success}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleCancel}
          disabled={state.saving || !state.hasChanges}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={state.saving || !state.hasChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {state.saving && (
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {state.saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
