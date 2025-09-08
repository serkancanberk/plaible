// src/admin/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { FilterBar } from '../components/FilterBar';
import { debounce } from '../utils/debounce';
import { adminApi, User } from '../api';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    query: '',
    role: '',
    status: ''
  });
  const [searchParams, setSearchParams] = useSearchParams();

  // URL'den başlangıç yüklemesi (ilk render)
  useEffect(() => {
    const qs = searchParams;
    const q = qs.get('query') ?? '';
    const r = qs.get('role') ?? '';
    const s = qs.get('status') ?? '';
    setFilters((prev) => {
      if (prev.query === q && prev.role === r && prev.status === s) return prev;
      return { query: q, role: r, status: s };
    });
    // yalnızca ilk mount'ta çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL'i güncellemek için debounce'lu bir handler
  const updateUrlDebounced = React.useMemo(
    () =>
      debounce((next: { query?: string; role?: string; status?: string }) => {
        const q = next.query ?? filters.query;
        const r = next.role ?? filters.role;
        const s = next.status ?? filters.status;
        const params: Record<string, string> = {};
        if (q) params.query = q;
        if (r) params.role = r;
        if (s) params.status = s;
        setSearchParams(params, { replace: true });
      }, 300),
    [filters.query, filters.role, filters.status, setSearchParams]
  );

  const loadUsers = useCallback(async () => {
    console.debug('[users] load start', {filters});
    setLoading(true);
    setError(null);            // clear previous error
    try {
      const resp = await adminApi.getUsers({ query: filters.query, role: filters.role, status: filters.status, limit: 10 });
      console.debug('[users] resp', resp);
      if (resp?.ok) {
        setUsers(resp.items ?? []);
        setError(null);        // be explicit
      } else {
        setUsers([]);
        setError(resp?.error || 'Failed to load users');
      }
    } catch (e: any) {
      console.debug('[users] error', e);
      setUsers([]);
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.role, filters.status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await adminApi.updateUserStatus(userId, newStatus as 'active' | 'disabled');
      await loadUsers(); // Reload to get updated data
    } catch (err: any) {
      console.error('Failed to update user status:', err);
    }
  };

  const columns = [
    {
      key: 'displayName',
      label: 'Display Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (roles: string[]) => roles.join(', '),
    },
    {
      key: 'wallet',
      label: 'Wallet',
      render: (wallet: any) => `${wallet?.balance ?? 0} credits`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string, user: User) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
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
      render: (_: any, user: User) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusToggle(user._id, user.status)}
            className={`px-3 py-1 text-xs rounded ${
              user.status === 'active'
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {user.status === 'active' ? 'Disable' : 'Enable'}
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner />;

  if (error) {
    return (
      <>
        <ErrorMessage title="Failed to load users" message={error} backHref="#/"/>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Users</h1>
        <FilterBar
          query={filters.query}
          role={filters.role}
          status={filters.status}
          onChange={(next) => {
            setFilters((prev) => ({ ...prev, ...next }));
            updateUrlDebounced(next);
          }}
        />
      </div>
      <Table
        data={users}
        columns={columns}
        emptyMessage="No users found"
      />
    </div>
  );
};
