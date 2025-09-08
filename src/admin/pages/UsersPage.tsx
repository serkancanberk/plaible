// src/admin/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
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
    <Table
      data={users}
      columns={columns}
      emptyMessage="No users found"
    />
  );
};
