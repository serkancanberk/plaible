// src/admin/pages/FeedbacksPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { debounce } from '../utils/debounce';
import { adminApi, AdminFeedback } from '../api';
import { FilterBarFeedbacks } from '../components/FilterBarFeedbacks';

export const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    storyId: '',
    status: '',
    starsGte: '',
    page: 1
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // URL'den başlangıç yüklemesi (ilk render)
  useEffect(() => {
    const sId = searchParams.get('storyId') ?? '';
    const st  = searchParams.get('status') ?? '';
    const sg  = searchParams.get('starsGte') ?? '';
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    setFilters(prev => (prev.storyId===sId && prev.status===st && prev.starsGte===sg && prev.page === p) ? prev : { storyId:sId, status:st, starsGte:sg, page: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL'i güncellemek için debounce'lu bir handler
  const updateUrlDebounced = React.useMemo(
    () => debounce((next: { storyId?: string; status?: string; starsGte?: string; page?: number }) => {
      const sId = next.storyId ?? filters.storyId;
      const st  = next.status ?? filters.status;
      const sg  = next.starsGte ?? filters.starsGte;
      const p = next.page ?? filters.page;
      const params: Record<string,string> = {};
      if (sId) params.storyId = sId;
      if (st)  params.status  = st;
      if (sg)  params.starsGte = sg;
      if (p > 1) params.page = p.toString();
      setSearchParams(params, { replace:true });
    }, 300),
    [filters.storyId, filters.status, filters.starsGte, filters.page, setSearchParams]
  );

  const loadFeedbacks = useCallback(async () => {
    console.debug('[feedbacks] load start', { filters });
    setLoading(true);
    setError(null);
    try {
      const sgNum = filters.starsGte ? Number(filters.starsGte) : undefined;
      const resp = await adminApi.getFeedbacks({
        storyId: filters.storyId || undefined,
        status:  filters.status  || undefined,
        starsGte: sgNum,
        limit: 10
      });
      console.debug('[feedbacks] resp', resp);
      if (resp?.ok) {
        setFeedbacks(resp.items ?? []);
        // Note: Feedbacks API uses cursor-based pagination, so we estimate totalCount
        setTotalCount(resp.items?.length === 10 ? (filters.page * 10) + 1 : filters.page * 10);
        setError(null);
      } else {
        setFeedbacks([]);
        setTotalCount(0);
        setError(resp?.error || 'Failed to load feedbacks');
      }
    } catch (e: unknown) {
      console.debug('[feedbacks] error', e);
      setFeedbacks([]);
      setTotalCount(0);
      setError((e as Error)?.message || 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  }, [filters.storyId, filters.status, filters.starsGte, filters.page]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleStatusToggle = async (feedbackId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
      await adminApi.updateFeedbackStatus(feedbackId, newStatus as 'visible' | 'hidden' | 'flagged');
      await loadFeedbacks(); // Reload to get updated data
      showToast('Feedback status updated successfully', 'success');
    } catch (err: unknown) {
      console.error('Failed to update feedback status:', err);
      showToast('Failed to update feedback status', 'error');
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await adminApi.deleteFeedback(feedbackId);
      await loadFeedbacks(); // Reload to get updated data
      showToast('Feedback deleted successfully', 'success');
    } catch (err: unknown) {
      console.error('Failed to delete feedback:', err);
      showToast('Failed to delete feedback', 'error');
    }
  };

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    updateUrlDebounced({ page: newPage });
  };

  const columns = [
    {
      key: 'storyId',
      label: 'Story ID',
    },
    {
      key: 'userId',
      label: 'User ID',
      render: (userId: string) => userId.substring(0, 8) + '...',
    },
    {
      key: 'stars',
      label: 'Stars',
      render: (stars: number) => '⭐'.repeat(stars),
    },
    {
      key: 'text',
      label: 'Text',
      render: (text: string) => text ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : '',
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          status === 'visible' 
            ? 'bg-green-100 text-green-800'
            : status === 'hidden'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, feedback: AdminFeedback) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusToggle(feedback._id, feedback.status)}
            className={`px-3 py-1 text-xs rounded ${
              feedback.status === 'visible'
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {feedback.status === 'visible' ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => handleDelete(feedback._id)}
            className="px-3 py-1 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200"
          >
            Delete
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedbacks</h1>
          <FilterBarFeedbacks
            storyId={filters.storyId}
            status={filters.status}
            starsGte={filters.starsGte}
            onChange={(next) => {
              setFilters(prev => ({ ...prev, ...next }));
              updateUrlDebounced(next);
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
        <ErrorMessage title="Failed to load feedbacks" message={error} backHref="#/"/>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedbacks</h1>
        <FilterBarFeedbacks
          storyId={filters.storyId}
          status={filters.status}
          starsGte={filters.starsGte}
          onChange={(next) => {
            setFilters(prev => ({ ...prev, ...next }));
            updateUrlDebounced(next);
          }}
        />
      </div>
      <Table
        data={feedbacks}
        columns={columns}
        emptyMessage={totalCount === 0 ? "No feedbacks match your filters." : "No feedbacks found"}
      />
      <Pagination
        currentPage={filters.page}
        hasNextPage={feedbacks.length === 10}
        totalCount={totalCount}
        limit={10}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
