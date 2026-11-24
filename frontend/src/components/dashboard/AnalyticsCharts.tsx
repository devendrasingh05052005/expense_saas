import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { DashboardAnalytics } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface AnalyticsChartsProps {
  analytics: DashboardAnalytics;
}

const DONUT_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analytics }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridColor = isDark ? '#1F293D' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#161F30' : '#FFFFFF';
  const tooltipBorder = isDark ? '#1F293D' : '#E2E8F0';

  // Prepare Donut data for members
  const memberDonutData = analytics.member_contributions.map((m, idx) => ({
    name: m.user_name,
    value: m.total_spent,
    percentage: m.percentage,
    color: m.avatar_color || DONUT_COLORS[idx % DONUT_COLORS.length],
  }));

  // Prepare Daily/Monthly Trend data
  const trendData = analytics.daily_trends.length > 0
    ? analytics.daily_trends.map((d) => ({
        label: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        amount: d.amount,
        count: d.count,
      }))
    : analytics.monthly_trends.map((m) => ({
        label: m.month,
        amount: m.amount,
        count: m.count,
      }));

  // Member comparison bar data
  const memberBarData = analytics.member_contributions.map((m) => ({
    name: m.user_name.split(' ')[0], // First name for clean axis
    amount: m.total_spent,
    percentage: m.percentage,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
          className="p-3 rounded-xl shadow-xl border text-xs"
        >
          <div className="font-semibold text-gray-900 dark:text-white mb-1">
            {label || data.name}
          </div>
          <div className="text-brand-600 dark:text-brand-400 font-bold text-sm">
            ₹{Number(data.value).toLocaleString('en-IN')}
          </div>
          {data.payload?.percentage !== undefined && (
            <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
              {data.payload.percentage}% of total individual spend
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Individual Contributions */}
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-card dark:shadow-card-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Individual Roommate Contributions
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Out-of-pocket spending share per member
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block uppercase font-semibold">Total</span>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                ₹{analytics.total_individual_expenses.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {memberDonutData.length === 0 || analytics.total_individual_expenses === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              No individual expenses recorded for this period.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={memberDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {memberDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val, entry: any) => (
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">
                        {val} ({entry.payload.percentage}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart: Member Comparison */}
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-card dark:shadow-card-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Member Expense Comparison
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Comparison of total amount spent by each roommate
              </p>
            </div>
          </div>

          {memberBarData.length === 0 || analytics.total_individual_expenses === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              No expenses to compare.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis
                    stroke={textColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Spending Trend Area Chart */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-card dark:shadow-card-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Spending Timeline & Trends
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Expense distribution across the selected time period
            </p>
          </div>
        </div>

        {trendData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-gray-400">
            No spending trend data available.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={textColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown Progress */}
      {analytics.category_distribution.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-card dark:shadow-card-dark">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.category_distribution.map((cat, idx) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                    {cat.category}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white shrink-0 ml-2">
                    ₹{cat.amount.toLocaleString('en-IN')} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
