import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/30 my-4">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-card flex items-center justify-center shadow-sm border border-gray-100 dark:border-dark-border text-brand-600 dark:text-brand-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
