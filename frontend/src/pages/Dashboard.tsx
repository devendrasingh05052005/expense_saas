import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Receipt,
  PiggyBank,
  CreditCard,
  Layers,
  Users,
  Award,
  Plus,
  Calendar,
  RotateCcw,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { DashboardAnalytics } from '../types';
import { StatCard } from '../components/dashboard/StatCard';
import { AnalyticsCharts } from '../components/dashboard/AnalyticsCharts';
import { Button } from '../components/common/Button';

interface ContextType {
  openAddExpense: () => void;
  openAddFundExpense: () => void;
  openAddContribution: () => void;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, fromDate, toDate, setFilterRange, resetFilterRange } = useGroup();
  const { openAddExpense, openAddFundExpense, openAddContribution } = useOutletContext<ContextType>();
  const { error } = useToast();

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Local filter inputs for the filter bar
  const [localFrom, setLocalFrom] = useState(fromDate);
  const [localTo, setLocalTo] = useState(toDate);

  const fetchAnalytics = useCallback(async () => {
    if (!currentGroup) return;
    setIsLoading(true);
    try {
      const data = await api.getAnalytics(currentGroup.id, {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setAnalytics(data);
    } catch (err: any) {
      error(err.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup, fromDate, toDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Listen to cross-component updates
  useEffect(() => {
    const handleRefresh = () => fetchAnalytics();
    window.addEventListener('expense-updated', handleRefresh);
    window.addEventListener('fund-updated', handleRefresh);
    return () => {
      window.removeEventListener('expense-updated', handleRefresh);
      window.removeEventListener('fund-updated', handleRefresh);
    };
  }, [fetchAnalytics]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterRange(localFrom, localTo);
  };

  const handleResetFilter = () => {
    setLocalFrom('');
    setLocalTo('');
    resetFilterRange();
  };

  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-gray-500">Calculating group analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Hello, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formattedToday} • Workspace: <strong className="text-brand-600 dark:text-brand-400">{currentGroup?.name}</strong>
          </p>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openAddExpense}
            leftIcon={<Receipt className="w-4 h-4" />}
          >
            Add Personal Expense
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={openAddFundExpense}
            leftIcon={<PiggyBank className="w-4 h-4 text-emerald-500" />}
          >
            Spend Fund Money
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={openAddContribution}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Contribute Fund
          </Button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs">
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Date Filter:</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">From</span>
            <input
              type="date"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              className="text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">To</span>
            <input
              type="date"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              className="text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button type="submit" size="sm" variant="secondary">
              Apply Filter
            </Button>
            {(fromDate || toDate) && (
              <Button type="button" size="sm" variant="ghost" onClick={handleResetFilter} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
                Reset Filter
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Key Metric Stat Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Personal Expenses"
            value={analytics.total_individual_expenses}
            subtitle="Combined out-of-pocket spend"
            icon={<Receipt className="w-4 h-4" />}
            iconBgColor="bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400"
            badge="Personal"
            badgeColor="indigo"
          />

          <StatCard
            title="Common Fund Balance"
            value={analytics.common_fund_balance}
            subtitle="Available pooled funds"
            icon={<PiggyBank className="w-4 h-4 text-emerald-600" />}
            iconBgColor="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
            badge="Pool Available"
            badgeColor="emerald"
          />

          <StatCard
            title="Common Fund Spent"
            value={analytics.common_fund_spent}
            subtitle="Deducted from shared pool"
            icon={<CreditCard className="w-4 h-4 text-amber-600" />}
            iconBgColor="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            badge="Fund Spend"
            badgeColor="amber"
          />

          <StatCard
            title="Total Transactions"
            value={analytics.total_transactions}
            isCurrency={false}
            subtitle="Individual + Fund logs"
            icon={<Layers className="w-4 h-4 text-indigo-600" />}
            iconBgColor="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
          />

          <StatCard
            title="Group Roommates"
            value={analytics.member_count}
            isCurrency={false}
            subtitle={`Avg spend: ₹${analytics.average_spending_per_member.toLocaleString('en-IN')}`}
            icon={<Users className="w-4 h-4 text-blue-600" />}
            iconBgColor="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
          />
        </div>
      )}

      {/* Highest Spender Highlight Callout */}
      {analytics?.highest_spender && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-transparent border border-brand-200 dark:border-brand-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-brand-700 dark:text-brand-300 font-semibold uppercase tracking-wider">
                Highest Spending Roommate
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {analytics.highest_spender.user_name} has contributed the most individual expenses!
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
              ₹{analytics.highest_spender.total_spent.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {analytics.highest_spender.percentage}% of group total
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {analytics && <AnalyticsCharts analytics={analytics} />}
    </div>
  );
};
