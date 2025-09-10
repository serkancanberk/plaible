// src/admin/pages/StoriesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { debounce } from '../utils/debounce';
import { adminApi, Story } from '../api';
import { FilterBarStories } from '../components/FilterBarStories';

export const StoriesPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    query: '',
    isActive: '' as '' | 'true' | 'false',
    page: 1
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // URL'den başlangıç yüklemesi (ilk render)
  useEffect(() => {
    const q = searchParams.get('query') ?? '';
    const a = searchParams.get('isActive') ?? '';
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    setFilters(prev => (prev.query === q && prev.isActive === a && prev.page === p) ? prev : { query: q, isActive: a as any, page: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL'i güncellemek için debounce'lu bir handler
  const updateUrlDebounced = React.useMemo(
    () => debounce((next: { query?: string; isActive?: ''|'true'|'false'; page?: number }) => {
      const q = next.query ?? filters.query;
      const a = next.isActive ?? filters.isActive;
      const p = next.page ?? filters.page;
      const params: Record<string,string> = {};
      if (q) params.query = q;
      if (a) params.isActive = a;
      if (p > 1) params.page = p.toString();
      setSearchParams(params, { replace: true });
    }, 300),
    [filters.query, filters.isActive, filters.page, setSearchParams]
  );

  const loadStories = useCallback(async () => {
    console.debug('[stories] load start', { filters });
    setLoading(true);
    setError(null);
    try {
      const isActiveBool = filters.isActive === '' ? undefined
                        : filters.isActive === 'true' ? true
                        : false;
      const resp = await adminApi.getStories({ 
        query: filters.query, 
        isActive: isActiveBool, 
        limit: 10
      });
      console.debug('[stories] resp', resp);
      if (resp?.ok) {
        setStories(resp.items ?? []);
        // Note: Stories API uses cursor-based pagination, so we estimate totalCount
        setTotalCount(resp.items?.length === 10 ? (filters.page * 10) + 1 : filters.page * 10);
        setError(null);
      } else {
        setStories([]);
        setTotalCount(0);
        setError(resp?.error || 'Failed to load stories');
      }
    } catch (e: any) {
      console.debug('[stories] error', e);
      setStories([]);
      setTotalCount(0);
      setError(e?.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.isActive, filters.page]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleStatusToggle = async (storyId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateStoryStatus(storyId, !currentStatus);
      await loadStories(); // Reload to get updated data
      showToast('Story status updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update story status:', err);
      showToast('Failed to update story status', 'error');
    }
  };

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    updateUrlDebounced({ page: newPage });
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
            onClick={() => navigate(`/stories/edit/${story._id}`)}
            className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Edit
          </button>
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

  // Skeleton loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stories</h1>
          <FilterBarStories
            query={filters.query}
            isActive={filters.isActive}
            onChange={(next) => {
              setFilters(prev => ({ ...prev, ...next, isActive: (next.isActive as '' | 'true' | 'false') || prev.isActive }));
              updateUrlDebounced({ ...next, isActive: (next.isActive as '' | 'true' | 'false') || filters.isActive });
            }}
          />
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <ErrorMessage title="Failed to load stories" message={error} backHref="#/"/>
        {/* dev-only */}
        {process.env.NODE_ENV !== 'production' && (
          <pre className="mt-2 text-xs opacity-60">filters: {JSON.stringify(filters)}</pre>
        )}
      </>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Stories</h1>
        <FilterBarStories
          query={filters.query}
          isActive={filters.isActive}
          onChange={(next) => {
            setFilters(prev => ({ ...prev, ...next, isActive: (next.isActive as '' | 'true' | 'false') || prev.isActive }));
            updateUrlDebounced({ ...next, isActive: (next.isActive as '' | 'true' | 'false') || filters.isActive });
          }}
        />
      </div>
      <Table
        data={stories}
        columns={columns}
        emptyMessage={totalCount === 0 ? "No stories match your filters." : "No stories found"}
      />
      <Pagination
        currentPage={filters.page}
        hasNextPage={stories.length === 10}
        totalCount={totalCount}
        limit={10}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
