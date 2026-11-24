import React, { useEffect, useState } from 'react';
import { X, History, ArrowUpRight, ArrowDownLeft, ShieldCheck, UserPlus, CreditCard } from 'lucide-react';
import { api } from '../../api/client';
import { useGroup } from '../../context/GroupContext';
import { Activity } from '../../types';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose }) => {
  const { currentGroup } = useGroup();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && currentGroup) {
      setIsLoading(true);
      api.getActivities(currentGroup.id)
        .then(setActivities)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentGroup]);

  if (!isOpen) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
        return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
      case 'fund_contributed':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case 'fund_spent':
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      case 'settlement_recorded':
        return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'member_joined':
      case 'member_added':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-dark-surface shadow-2xl border-l border-gray-200 dark:border-dark-border flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-semibold text-base text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-card"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-sm text-gray-400">Loading activities...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">No activity logged yet.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3 items-start">
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border shrink-0 mt-0.5">
                    {getActivityIcon(act.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(act.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
