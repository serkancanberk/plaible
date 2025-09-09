// src/admin/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table } from '../components/Table';
import { ErrorMessage } from '../components/ErrorMessage';
import { FilterBar } from '../components/FilterBar';
import { UserRowSkeleton } from '../components/UserRowSkeleton';
import { EditUserModal } from '../components/EditUserModal';
import { CreateUserModal } from '../components/CreateUserModal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { debounce } from '../utils/debounce';
import { adminApi, User } from '../api';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    query: '',
    role: '',
    status: '',
    searchField: '',
    page: 1
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { showToast } = useToast();

  // URL'den başlangıç yüklemesi (ilk render)
  useEffect(() => {
    const qs = searchParams;
    const q = qs.get('query') ?? '';
    const r = qs.get('role') ?? '';
    const s = qs.get('status') ?? '';
    const sf = qs.get('searchField') ?? '';
    const p = parseInt(qs.get('page') ?? '1', 10);
    setFilters((prev) => {
      if (prev.query === q && prev.role === r && prev.status === s && prev.searchField === sf && prev.page === p) return prev;
      return { query: q, role: r, status: s, searchField: sf, page: p };
    });
    // yalnızca ilk mount'ta çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL'i güncellemek için debounce'lu bir handler
  const updateUrlDebounced = React.useMemo(
    () =>
      debounce((next: { query?: string; role?: string; status?: string; searchField?: string; page?: number }) => {
        const q = next.query ?? filters.query;
        const r = next.role ?? filters.role;
        const s = next.status ?? filters.status;
        const sf = next.searchField ?? filters.searchField;
        const p = next.page ?? filters.page;
        const params: Record<string, string> = {};
        if (q) params.query = q;
        if (r) params.role = r;
        if (s) params.status = s;
        if (sf) params.searchField = sf;
        if (p > 1) params.page = p.toString();
        setSearchParams(params, { replace: true });
      }, 300),
    [filters.query, filters.role, filters.status, filters.searchField, filters.page, setSearchParams]
  );

  const loadUsers = useCallback(async () => {
    console.debug('[users] load start', {filters});
    setLoading(true);
    setError(null);
    try {
      const limit = 10;
      const offset = (filters.page - 1) * limit;
      const resp = await adminApi.getUsers({ 
        query: filters.query, 
        role: filters.role, 
        status: filters.status,
        searchField: filters.searchField,
        limit,
        offset
      });
      console.debug('[users] resp', resp);
      if (resp?.ok) {
        setUsers(resp.items ?? []);
        setTotalCount(resp.totalCount ?? 0);
        setError(null);
      } else {
        setUsers([]);
        setTotalCount(0);
        setError(resp?.error || 'Failed to load users');
      }
    } catch (e: any) {
      console.debug('[users] error', e);
      setUsers([]);
      setTotalCount(0);
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.role, filters.status, filters.searchField, filters.page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Modal handlers
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userId: string, updatedFields: any) => {
    await adminApi.updateUser(userId, updatedFields);
    await loadUsers(); // Reload to get updated data
    showToast('User updated successfully', 'success');
  };

  const handleCreateUser = async (userData: { displayName: string; email: string; roles: string[]; status: 'active' | 'disabled'; walletBalance: number }) => {
    try {
      const response = await adminApi.createUser(userData);
      if (response.ok) {
        await loadUsers(); // Reload to get updated data
        showToast('User created successfully', 'success');
      } else {
        showToast(response.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Failed to create user', 'error');
    }
  };

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    updateUrlDebounced({ page: newPage });
  };

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
      key: 'balance',
      label: 'Wallet',
      render: (balance: number, user: User) => {
        // Handle both possible data structures: flat balance or nested wallet.balance
        const walletBalance = balance ?? user.wallet?.balance ?? 0;
        return `${walletBalance} credits`;
      },
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
            onClick={() => handleEditUser(user)}
            className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Edit
          </button>
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

  // Skeleton loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <span>+</span>
              <span>Create New User</span>
            </button>
          </div>
          <FilterBar
            query={filters.query}
            role={filters.role}
            status={filters.status}
            searchField={filters.searchField}
            onChange={(next) => {
              setFilters((prev) => ({ ...prev, ...next }));
              updateUrlDebounced(next);
            }}
          />
        </div>
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 10 }).map((_, i) => (
                <UserRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create New User</span>
          </button>
        </div>
        <FilterBar
          query={filters.query}
          role={filters.role}
          status={filters.status}
          searchField={filters.searchField}
          onChange={(next) => {
            setFilters((prev) => ({ ...prev, ...next }));
            updateUrlDebounced(next);
          }}
        />
      </div>
      <Table
        data={users}
        columns={columns}
        emptyMessage={totalCount === 0 ? "No users match your filters." : "No users found"}
      />
      <Pagination
        currentPage={filters.page}
        hasNextPage={users.length === 10}
        totalCount={totalCount}
        limit={10}
        onPageChange={handlePageChange}
      />
      <EditUserModal
        user={editingUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
      />
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
};
