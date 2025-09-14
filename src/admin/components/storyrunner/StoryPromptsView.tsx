// src/admin/components/storyrunner/StoryPromptsView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../Table';
import { Spinner } from '../Spinner';
import { ErrorMessage } from '../ErrorMessage';
import { useToast } from '../Toast';
import { adminApi, Story } from '../../api';

interface StoryPromptData {
  _id: string;
  title: string;
  storyPrompt: string;
  isActive: boolean;
  updatedAt: string;
}

export const StoryPromptsView: React.FC = () => {
  const [stories, setStories] = useState<StoryPromptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [pageSize] = useState(10);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getStories({
        limit: pageSize,
        cursor: cursor
      });

      if (response?.ok && response.items) {
        // Transform stories to include prompt data
        const promptData: StoryPromptData[] = response.items.map((story: Story) => ({
          _id: story._id,
          title: story.title,
          storyPrompt: story.storyrunner?.storyPrompt || story.storyrunner?.systemPrompt || '',
          isActive: story.isActive || false,
          updatedAt: story.updatedAt || story.createdAt || new Date().toISOString()
        }));

        if (cursor) {
          // Append to existing stories for "load more" functionality
          setStories(prev => [...prev, ...promptData]);
        } else {
          // Replace stories for initial load
          setStories(promptData);
        }
        setNextCursor(response.nextCursor);
        // Estimate total count based on items returned
        setTotalCount(promptData.length === pageSize ? (promptData.length + 1) : promptData.length);
      } else {
        setError('Failed to load stories');
        setStories([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      console.error('Failed to load stories:', err);
      setError((err as Error)?.message || 'Failed to load stories');
      setStories([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [cursor, pageSize]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleEdit = (storyId: string) => {
    navigate(`/storyrunner/prompts/edit/${storyId}`);
  };

  const handleToggleActive = async (storyId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await adminApi.updateStory(storyId, { isActive: newStatus });
      await loadStories(); // Reload to get updated data
      showToast(`Story ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err: unknown) {
      console.error('Failed to toggle story status:', err);
      showToast('Failed to update story status', 'error');
    }
  };

  const columns = [
    {
      key: '_id',
      label: 'Story ID',
      render: (id: string) => (
        <span className="font-mono text-sm text-gray-600">
          {id.substring(0, 12)}...
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Story Title',
      render: (title: string) => (
        <span className="font-medium text-gray-900">
          {title || 'Untitled Story'}
        </span>
      ),
    },
    {
      key: 'storyPrompt',
      label: 'Prompt Preview',
      render: (prompt: string) => (
        <div className="max-w-xs">
          <span className="text-sm text-gray-600">
            {prompt ? `${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}` : 'No prompt configured'}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (isActive: boolean, story: StoryPromptData) => (
        <button
          onClick={() => handleToggleActive(story._id, isActive)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            isActive
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {isActive ? 'Yes' : 'No'}
        </button>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (date: string) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, story: StoryPromptData) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(story._id)}
            className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage title="Failed to load story prompts" message={error} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Story Prompts</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage AI prompt templates for all stories
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {totalCount} total stories
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          data={stories}
          columns={columns}
          emptyMessage="No stories found with prompt templates"
        />
      </div>

      {nextCursor && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setCursor(nextCursor)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load More Stories
          </button>
        </div>
      )}
    </div>
  );
};
