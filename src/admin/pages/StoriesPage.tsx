// src/admin/pages/StoriesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { adminApi, Story } from '../api';

export const StoriesPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    query: '',
    isActive: ''
  });

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);            // clear previous error
    try {
      const params: any = {};
      if (filters.query) params.query = filters.query;
      if (filters.isActive) params.isActive = filters.isActive === 'true';
      
      const resp = await adminApi.getStories(params);
      if (resp?.ok) {
        setStories(resp.items ?? []);
        setError(null);        // be explicit
      } else {
        setStories([]);
        setError(resp?.error || 'Failed to load stories');
      }
    } catch (e: any) {
      setStories([]);
      setError(e?.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.isActive]);

  useEffect(() => {
    loadStories();
  }, [filters]);

  const handleStatusToggle = async (storyId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateStoryStatus(storyId, !currentStatus);
      await loadStories(); // Reload to get updated data
    } catch (err: any) {
      console.error('Failed to update story status:', err);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'slug',
      label: 'Slug',
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (isActive: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'pricing.creditsPerChapter',
      label: 'Credits/Chapter',
    },
    {
      key: 'stats.avgRating',
      label: 'Avg Rating',
      render: (rating: number) => rating ? `${rating.toFixed(1)} ⭐` : 'No ratings',
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, story: Story) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusToggle(story._id, story.isActive)}
            className={`px-3 py-1 text-xs rounded ${
              story.isActive
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {story.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner />;

  if (error) {
    return (
      <ErrorMessage title="Failed to load stories" message={error} backHref="#/"/>
    );
  }

  return (
    <Table
      data={stories}
      columns={columns}
      emptyMessage="No stories found"
    />
  );
};
