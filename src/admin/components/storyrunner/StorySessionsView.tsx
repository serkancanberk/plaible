// src/admin/components/storyrunner/StorySessionsView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table } from '../Table';
import { Spinner } from '../Spinner';
import { ErrorMessage } from '../ErrorMessage';
import { Pagination } from '../Pagination';
import { useToast } from '../Toast';
import { debounce } from '../../utils/debounce';
import { adminApi, UserStorySession } from '../../api';

export const StorySessionsView: React.FC = () => {
  const [sessions, setSessions] = useState<UserStorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    userId: '',
    storyId: '',
    status: '' as '' | 'active' | 'finished' | 'abandoned',
    page: 1
  });

  const { showToast } = useToast();

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        limit: 10,
        offset: (filters.page - 1) * 10
      };
      
      if (filters.userId) params.userId = filters.userId;
      if (filters.storyId) params.storyId = filters.storyId;
      if (filters.status) params.status = filters.status;

      const response = await adminApi.getStorySessions(params);
      
      if (response.ok) {
        setSessions(response.sessions);
        setTotalCount(response.totalCount || 0);
      } else {
        setError(response.error || 'Failed to load story sessions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story sessions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced search
  const debouncedLoadSessions = useCallback(
    debounce(() => {
      setFilters(prev => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    debouncedLoadSessions();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      finished: 'bg-blue-100 text-blue-800',
      abandoned: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  const columns = [
    {
      key: 'userId',
      label: 'User ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value.substring(0, 8)}...</span>
      )
    },
    {
      key: 'storyId',
      label: 'Story ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'toneStyleId',
      label: 'Tone Style',
      render: (value: string) => (
        <span className="capitalize">{value}</span>
      )
    },
    {
      key: 'timeFlavorId',
      label: 'Time Flavor',
      render: (value: string) => (
        <span className="capitalize">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'currentChapter',
      label: 'Chapter',
      render: (value: number, session: UserStorySession) => (
        <span className="text-sm">
          {value} / {session.chaptersGenerated}
        </span>
      )
    },
    {
      key: 'sessionStartedAt',
      label: 'Started',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {formatDate(value)}
        </span>
      )
    },
    {
      key: 'lastActivityAt',
      label: 'Last Activity',
      render: (value: string, session: UserStorySession) => (
        <div className="text-sm">
          <div className="text-gray-600">{formatDate(value)}</div>
          <div className="text-xs text-gray-500">
            {formatDuration(session.sessionStartedAt, value)}
          </div>
        </div>
      )
    }
  ];

  if (loading && sessions.length === 0) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadSessions} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Story Sessions</h2>
        <div className="text-sm text-gray-600">
          {totalCount} total sessions
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story ID
            </label>
            <input
              type="text"
              value={filters.storyId}
              onChange={(e) => handleFilterChange('storyId', e.target.value)}
              placeholder="Filter by story ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="finished">Finished</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ userId: '', storyId: '', status: '', page: 1 });
              }}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={sessions}
          columns={columns}
          loading={loading}
          emptyMessage="No story sessions found"
        />
        
        {totalCount > 10 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={filters.page}
              totalPages={Math.ceil(totalCount / 10)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
