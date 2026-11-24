import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'rose' | 'indigo' | 'amber';
  isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400',
  badge,
  badgeColor = 'emerald',
  isCurrency = true,
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-card dark:shadow-card-dark transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {typeof value === 'number'
            ? (isCurrency ? `₹${value.toLocaleString('en-IN')}` : value.toLocaleString('en-IN'))
            : value}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>
          )}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${badgeClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
