// src/admin/pages/WalletAnalyticsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table } from '../components/Table';
import { ErrorMessage } from '../components/ErrorMessage';
import { Spinner } from '../components/Spinner';
import { SimpleChart } from '../components/SimpleChart';
import { useToast } from '../components/Toast';
import { adminApi, WalletAnalytics, TopCreditUser, TransactionStats, TransactionLog } from '../api';

interface Filters {
  startDate: string;
  endDate: string;
  type: string;
  source: string;
  page: number;
  limit: number;
}

export const WalletAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [topUsers, setTopUsers] = useState<TopCreditUser[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [totalTransactionCount, setTotalTransactionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUsersSort, setTopUsersSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'balance', direction: 'desc' });
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    type: '',
    source: '',
    page: 1,
    limit: 20
  });
  const { showToast } = useToast();

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, topUsersRes, statsRes, logsRes] = await Promise.all([
        adminApi.getWalletAnalytics(),
        adminApi.getTopCreditUsers(10),
        adminApi.getTransactionStats({
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: filters.type || undefined,
          source: filters.source || undefined
        }),
        adminApi.getTransactionLogs({
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: filters.type || undefined,
          source: filters.source || undefined,
          limit: filters.limit,
          offset: (filters.page - 1) * filters.limit
        })
      ]);

      if (analyticsRes.ok) {
        setAnalytics(analyticsRes.analytics);
        setTopUsers(analyticsRes.analytics.topUsers);
        
        if (import.meta.env.DEV) {
          console.log("🔍 Frontend Analytics Data:", analyticsRes.analytics);
        }
      } else {
        setError('Failed to load analytics');
      }

      if (topUsersRes.ok) {
        setTopUsers(topUsersRes.users);
      }

      if (statsRes.ok) {
        setTransactionStats(statsRes.stats);
        
        if (import.meta.env.DEV) {
          console.log("🔍 Frontend Transaction Stats:", statsRes.stats);
        }
      }

      if (logsRes.ok) {
        setTransactionLogs(logsRes.transactions);
        setTotalTransactionCount(logsRes.totalCount);
        
        if (import.meta.env.DEV) {
          console.log("🔍 Frontend Transaction Logs:", {
            count: logsRes.transactions.length,
            total: logsRes.totalCount
          });
        }
      }

      // Get real daily transaction data
      const dailyData = await getRealDailyData(filters.startDate, filters.endDate);
      setDailyData(dailyData);

    } catch (err) {
      console.error('Error loading wallet analytics:', err);
      setError('Failed to load wallet analytics');
      showToast('Failed to load wallet analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const getRealDailyData = async (startDate: string, endDate: string) => {
    try {
      // Get daily transaction data from the backend
      const response = await adminApi.getDailySummary(startDate);
      
      if (response?.ok && response.summary) {
        const { stats } = response.summary;
        return [{
          date: startDate,
          credits: stats.creditsAdded || 0,
          debits: stats.creditsSpent || 0
        }];
      }
      
      // Fallback to empty data if no real data available
      return [{
        date: startDate,
        credits: 0,
        debits: 0
      }];
    } catch (error) {
      console.error('Error getting real daily data:', error);
      // Fallback to empty data
      return [{
        date: startDate,
        credits: 0,
        debits: 0
      }];
    }
  };

  // Load analytics when filters change, but prevent duplicate calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAnalytics();
    }, 100); // Small delay to prevent rapid successive calls

    return () => clearTimeout(timeoutId);
  }, [loadAnalytics]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 when filters change
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const exportTransactionLogsToCSV = () => {
    if (transactionLogs.length === 0) {
      showToast('No transactions to export', 'warning');
      return;
    }

    // Create CSV headers
    const headers = ['User', 'Email', 'Type', 'Amount', 'Source', 'Date', 'Balance After'];
    
    // Create CSV rows
    const rows = transactionLogs.map(transaction => [
      transaction.user.displayName || 'Unknown',
      transaction.user.email || '',
      transaction.type === 'credit' ? 'Credits Added' : 'Credits Spent',
      transaction.amount,
      transaction.source,
      new Date(transaction.createdAt).toLocaleString(),
      transaction.balanceAfter
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `transactions-${today}.csv`;
    link.setAttribute('download', filename);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('🔍 CSV exported:', { filename, rowCount: transactionLogs.length });
    showToast(`Exported ${transactionLogs.length} transactions to ${filename}`, 'success');
  };

  const handleTopUsersSort = (key: string) => {
    setTopUsersSort(prev => {
      const newDirection = prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc';
      console.log('🔍 Top Users sort changed:', { key, direction: newDirection });
      return { key, direction: newDirection };
    });
  };

  const getSortedTopUsers = () => {
    if (!topUsers.length) return topUsers;
    
    return [...topUsers].sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (topUsersSort.key === 'displayName') {
        aValue = a.displayName?.toLowerCase() || '';
        bValue = b.displayName?.toLowerCase() || '';
      } else if (topUsersSort.key === 'balance') {
        aValue = a.balance || 0;
        bValue = b.balance || 0;
      } else {
        return 0;
      }
      
      if (aValue < bValue) return topUsersSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return topUsersSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const topUsersColumns = [
    {
      key: 'displayName',
      label: 'User',
      sortable: true,
      render: (displayName: string, user: TopCreditUser) => (
        <div>
          <div className="font-medium text-gray-900">{displayName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (balance: number) => (
        <span className="font-semibold text-green-600">{balance} credits</span>
      ),
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (roles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {roles.map(role => (
            <span
              key={role}
              className={`px-2 py-1 text-xs rounded-full ${
                role === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {role}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      ),
    },
  ];

  const transactionLogsColumns = [
    {
      key: 'user',
      label: 'User',
      render: (user: TransactionLog['user']) => (
        <div>
          <div className="font-medium text-gray-900">{user.displayName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (type: string, transaction: TransactionLog) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          type === 'credit' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {transaction.description}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (amount: number, transaction: TransactionLog) => (
        <span className={`font-semibold ${
          transaction.type === 'credit' 
            ? 'text-green-600' 
            : 'text-red-600'
        }`}>
          {transaction.type === 'credit' ? '+' : '-'}{amount} credits
        </span>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (source: string) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {source}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (createdAt: string) => (
        <div>
          <div className="text-sm text-gray-900">
            {new Date(createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      render: (balanceAfter: number) => (
        <span className="font-medium text-gray-900">{balanceAfter} credits</span>
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
        <ErrorMessage title="Failed to load wallet analytics" message={error} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor wallet balances, transactions, and user spending patterns</p>
      </div>

      {/* Summary Panel */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Wallet Balance</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalCredits.toLocaleString()}</p>
              <p className="text-xs text-gray-500">({transactionStats?.totalTransactions || 0} total transactions)</p>
            </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Balance</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.averageBalance}</p>
                <p className="text-xs text-gray-500">({analytics.totalUsers} users)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Zero Balance Users</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.zeroBalanceUsers}</p>
                <p className="text-xs text-gray-500">({analytics.totalUsers > 0 ? Math.round((analytics.zeroBalanceUsers / analytics.totalUsers) * 100) : 0}%)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Balance Users</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.highBalanceUsers}</p>
                <p className="text-xs text-gray-500">(100+ credits)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              <option value="admin">Admin</option>
              <option value="purchase">Purchase</option>
              <option value="ai">AI Usage</option>
              <option value="topup">Top-up</option>
              <option value="play">Story Play</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Transaction Logs</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {transactionLogs.length} of {totalTransactionCount} transactions
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Transaction Type Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Filter:</label>
                  <select
                    value={filters.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      console.log('🔍 Transaction filter changed:', newType);
                      handleFilterChange('type', newType);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="credit">Credits Added</option>
                    <option value="debit">Credits Spent</option>
                  </select>
                </div>
                {/* CSV Export Button */}
                <button
                  onClick={() => {
                    console.log('🔍 Exporting CSV for transactions:', transactionLogs.length);
                    exportTransactionLogsToCSV();
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table
              data={transactionLogs}
              columns={transactionLogsColumns}
              emptyMessage="No transactions found for the selected filters"
            />
          </div>
          {totalTransactionCount > filters.limit && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalTransactionCount)} of {totalTransactionCount} transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {filters.page} of {Math.ceil(totalTransactionCount / filters.limit)}
                  </span>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= Math.ceil(totalTransactionCount / filters.limit)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Stats */}
      {transactionStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Activity Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions:</span>
                <span className="font-semibold">{transactionStats.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Added:</span>
                <span className="font-semibold text-green-600">{transactionStats.creditsAdded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Spent:</span>
                <span className="font-semibold text-red-600">{transactionStats.creditsSpent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net from Transactions:</span>
                <span className={`font-semibold ${transactionStats.netCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transactionStats.netCredits}
                </span>
              </div>
            </div>
            
            {/* Data consistency confirmation */}
            {analytics && transactionStats && 
             Math.abs(analytics.totalCredits - transactionStats.netCredits) <= 1 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Data Consistency:</strong> Wallet balances and transaction records are now synchronized. 
                      All wallet balances are derived from transaction history for full auditability.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Users by Wallet Balance</h3>
        </div>
        <Table
          data={getSortedTopUsers()}
          columns={topUsersColumns}
          emptyMessage="No users found"
          sortKey={topUsersSort.key}
          sortDirection={topUsersSort.direction}
          onSort={handleTopUsersSort}
        />
      </div>
    </div>
  );
};
