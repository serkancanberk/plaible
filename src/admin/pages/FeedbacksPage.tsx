// src/admin/pages/FeedbacksPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { adminApi, Feedback } from '../api';

export const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    storyId: '',
    status: '',
    starsGte: ''
  });

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);            // clear previous error
    try {
      const params: any = {};
      if (filters.storyId) params.storyId = filters.storyId;
      if (filters.status) params.status = filters.status;
      if (filters.starsGte) params.starsGte = parseInt(filters.starsGte);
      
      const resp = await adminApi.getFeedbacks(params);
      if (resp?.ok) {
        setFeedbacks(resp.items ?? []);
        setError(null);        // be explicit
      } else {
        setFeedbacks([]);
        setError(resp?.error || 'Failed to load feedbacks');
      }
    } catch (e: any) {
      setFeedbacks([]);
      setError(e?.message || 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  }, [filters.storyId, filters.status, filters.starsGte]);

  useEffect(() => {
    loadFeedbacks();
  }, [filters]);

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
      <ErrorMessage title="Failed to load feedbacks" message={error} backHref="#/"/>
    );
  }

  return (
    <Table
      data={feedbacks}
      columns={columns}
      emptyMessage="No feedbacks found"
    />
  );
};
