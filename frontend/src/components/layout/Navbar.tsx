import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Plus,
  Calendar,
  PiggyBank,
  Receipt,
  ChevronDown,
  History,
  RotateCcw,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { useNetwork } from '../../context/NetworkContext';
import { Button } from '../common/Button';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenAddExpense: () => void;
  onOpenAddFundExpense: () => void;
  onOpenAddContribution: () => void;
  onToggleActivityDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onOpenAddExpense,
  onOpenAddFundExpense,
  onOpenAddContribution,
  onToggleActivityDrawer,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { fromDate, toDate, setFilterRange, resetFilterRange } = useGroup();
  const { isStandalone, promptInstall } = useNetwork();
  const { success } = useToast();

  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [tempFromDate, setTempFromDate] = useState(fromDate);
  const [tempToDate, setTempToDate] = useState(toDate);

  const handleApplyDateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterRange(tempFromDate, tempToDate);
    setIsDateFilterOpen(false);
    success('Date filter applied across all modules.');
  };

  const handleResetDateFilter = () => {
    setTempFromDate('');
    setTempToDate('');
    resetFilterRange();
    setIsDateFilterOpen(false);
    success('Date filters reset.');
  };

  const hasActiveDateFilter = Boolean(fromDate || toDate);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-gray-200 dark:border-dark-border px-3 sm:px-6 flex items-center justify-between transition-colors w-full min-w-0">
      {/* Left: Mobile Toggle & Date Filter */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-card shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Date Filter Quick Button */}
        <div className="relative">
          <button
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 ${
              hasActiveDateFilter
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-semibold'
                : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {hasActiveDateFilter
                ? `${fromDate || 'Start'} → ${toDate || 'Today'}`
                : 'Date Range'}
            </span>
            <span className="inline sm:hidden text-[11px]">
              {hasActiveDateFilter ? 'Filtered' : 'Filter'}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </button>

          {/* Date Filter Dropdown */}
          {isDateFilterOpen && (
            <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border p-4 z-50">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-dark-border">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Filter by Date
                </span>
                {hasActiveDateFilter && (
                  <button
                    onClick={handleResetDateFilter}
                    className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <form onSubmit={handleApplyDateFilter} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={tempFromDate}
                    onChange={(e) => setTempFromDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={tempToDate}
                    onChange={(e) => setTempToDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" className="w-full">
                    Apply Filter
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle, Activity & Actions */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Install App button if not already running standalone */}
        {!isStandalone && (
          <button
            type="button"
            onClick={() => promptInstall()}
            title="Install App (Android, iPhone, Windows)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Activity feed button */}
        <button
          onClick={onToggleActivityDrawer}
          title="Activity Log"
          className="p-1.5 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card border border-transparent hover:border-gray-200 dark:hover:border-dark-border transition-colors shrink-0"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Theme Toggle - Clickable with clean visual state */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card border border-gray-200 dark:border-dark-border transition-all flex items-center justify-center cursor-pointer shadow-xs shrink-0"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            size="sm"
            onClick={onOpenAddExpense}
            leftIcon={<Receipt className="w-3.5 h-3.5 shrink-0" />}
            className="shadow-sm text-xs px-2.5 sm:px-3 py-1.5 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Add </span>Expense
          </Button>
        </div>
      </div>
    </header>
  );
};
