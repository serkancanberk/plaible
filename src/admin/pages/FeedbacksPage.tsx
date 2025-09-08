// src/admin/pages/FeedbacksPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { debounce } from '../utils/debounce';
import { adminApi, Feedback } from '../api';
import { FilterBarFeedbacks } from '../components/FilterBarFeedbacks';

export const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    storyId: '',
    status: '',
    starsGte: ''
  });
  const [searchParams, setSearchParams] = useSearchParams();

  // URL'den başlangıç yüklemesi (ilk render)
  useEffect(() => {
    const sId = searchParams.get('storyId') ?? '';
    const st  = searchParams.get('status') ?? '';
    const sg  = searchParams.get('starsGte') ?? '';
    setFilters(prev => (prev.storyId===sId && prev.status===st && prev.starsGte===sg) ? prev : { storyId:sId, status:st, starsGte:sg });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL'i güncellemek için debounce'lu bir handler
  const updateUrlDebounced = React.useMemo(
    () => debounce((next: { storyId?: string; status?: string; starsGte?: string }) => {
      const sId = next.storyId ?? filters.storyId;
      const st  = next.status ?? filters.status;
      const sg  = next.starsGte ?? filters.starsGte;
      const params: Record<string,string> = {};
      if (sId) params.storyId = sId;
      if (st)  params.status  = st;
      if (sg)  params.starsGte = sg;
      setSearchParams(params, { replace:true });
    }, 300),
    [filters.storyId, filters.status, filters.starsGte, setSearchParams]
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
        starsGte: sgNum as any,
        limit: 10
      });
      console.debug('[feedbacks] resp', resp);
      if (resp?.ok) {
        setFeedbacks(resp.items ?? []);
        setError(null);
      } else {
        setFeedbacks([]);
        setError(resp?.error || 'Failed to load feedbacks');
      }
    } catch (e: any) {
      console.debug('[feedbacks] error', e);
      setFeedbacks([]);
      setError(e?.message || 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  }, [filters.storyId, filters.status, filters.starsGte]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleStatusToggle = async (feedbackId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
      await adminApi.updateFeedbackStatus(feedbackId, newStatus as 'visible' | 'hidden' | 'flagged');
      await loadFeedbacks(); // Reload to get updated data
    } catch (err: any) {
      console.error('Failed to update feedback status:', err);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await adminApi.deleteFeedback(feedbackId);
      await loadFeedbacks(); // Reload to get updated data
    } catch (err: any) {
      console.error('Failed to delete feedback:', err);
    }
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
      render: (_: any, feedback: Feedback) => (
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

  if (loading) return <Spinner />;

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
        emptyMessage="No feedbacks found"
      />
    </div>
  );
};
