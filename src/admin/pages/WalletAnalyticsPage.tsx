// src/admin/pages/WalletAnalyticsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table } from '../components/Table';
import { ErrorMessage } from '../components/ErrorMessage';
import { Spinner } from '../components/Spinner';
import { SimpleChart } from '../components/SimpleChart';
import { useToast } from '../components/Toast';
import { adminApi, WalletAnalytics, TopCreditUser, DailySummary, TransactionStats } from '../api';

interface Filters {
  startDate: string;
  endDate: string;
  type: string;
  source: string;
}

export const WalletAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [topUsers, setTopUsers] = useState<TopCreditUser[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    type: '',
    source: ''
  });
  const { showToast } = useToast();

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, topUsersRes, statsRes] = await Promise.all([
        adminApi.getWalletAnalytics(),
        adminApi.getTopCreditUsers(10),
        adminApi.getTransactionStats({
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: filters.type || undefined,
          source: filters.source || undefined
        })
      ]);

      if (analyticsRes.ok) {
        setAnalytics(analyticsRes.analytics);
        setTopUsers(analyticsRes.analytics.topUsers);
        
        if (import.meta.env?.DEV) {
          console.log("🔍 Frontend Analytics Data:", analyticsRes.analytics);
        }
      } else {
        setError(analyticsRes.error || 'Failed to load analytics');
      }

      if (topUsersRes.ok) {
        setTopUsers(topUsersRes.users);
      }

      if (statsRes.ok) {
        setTransactionStats(statsRes.stats);
        
        if (import.meta.env?.DEV) {
          console.log("🔍 Frontend Transaction Stats:", statsRes.stats);
        }
      }

      // Generate mock daily data for the chart (since we don't have a specific daily endpoint yet)
      const mockDailyData = generateMockDailyData(filters.startDate, filters.endDate);
      setDailyData(mockDailyData);

    } catch (err) {
      console.error('Error loading wallet analytics:', err);
      setError('Failed to load wallet analytics');
      showToast('Failed to load wallet analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const generateMockDailyData = (startDate: string, endDate: string) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toISOString().split('T')[0],
        credits: Math.floor(Math.random() * 100) + 10,
        debits: Math.floor(Math.random() * 80) + 5
      });
    }
    
    return data;
  };

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const topUsersColumns = [
    {
      key: 'displayName',
      label: 'User',
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
        <ErrorMessage message={error} />
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
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalCredits.toLocaleString()}</p>
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

      {/* Chart Section */}
      <div className="mb-8">
        <SimpleChart
          data={dailyData}
          title="Daily Credits Added and Spent"
          height={300}
        />
      </div>

      {/* Transaction Stats */}
      {transactionStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Summary</h3>
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
                <span className="text-gray-600">Net Credits:</span>
                <span className={`font-semibold ${transactionStats.netCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transactionStats.netCredits}
                </span>
              </div>
            </div>
            
            {/* Fallback warning for data inconsistencies */}
            {analytics && analytics.totalCredits > 0 && 
             transactionStats.creditsAdded === 0 && 
             transactionStats.creditsSpent === 0 && 
             transactionStats.netCredits === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No transaction history found. Balances may have been edited directly.
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
          data={topUsers}
          columns={topUsersColumns}
          emptyMessage="No users found"
        />
      </div>
    </div>
  );
};
