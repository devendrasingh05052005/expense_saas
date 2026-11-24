import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  Receipt,
  User,
  RotateCcw,
  Tag
} from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Expense } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';

export const IndividualExpensesPage: React.FC = () => {
  const { currentGroup, members, fromDate, toDate, setFilterRange, resetFilterRange } = useGroup();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!currentGroup) return;
    setIsLoading(true);
    try {
      const data = await api.getExpenses(currentGroup.id, {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        member_id: selectedMember !== 'all' ? selectedMember : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: search.trim() || undefined,
        sort_by: sortBy,
      });
      setExpenses(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch expenses.');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup, fromDate, toDate, selectedMember, selectedCategory, search, sortBy]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDeleteConfirm = async () => {
    if (!currentGroup || !expenseToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteExpense(currentGroup.id, expenseToDelete.id);
      success('Expense deleted successfully.');
      setExpenseToDelete(null);
      fetchExpenses();
      window.dispatchEvent(new CustomEvent('expense-updated'));
    } catch (err: any) {
      error(err.message || 'Failed to delete expense.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalFilteredAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Individual Expense Tracking
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track expenses paid personally out of pocket by any roommate.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Personal Expense
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search description (e.g. Milk, Gas)..."
              prefixIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Member Filter */}
          <div>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Roommates</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  Paid by: {m.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Categories</option>
              <option value="Groceries">Groceries</option>
              <option value="Utilities">Utilities</option>
              <option value="Household">Household</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: Highest First</option>
              <option value="amount_asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>

        {/* Total Summary Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-900 dark:text-white">{expenses.length}</strong> transactions
          </div>
          <div className="font-semibold text-gray-900 dark:text-white">
            Filtered Total:{' '}
            <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">
              ₹{totalFilteredAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-8 h-8" />}
            title="No personal expenses found"
            description="No individual expenses have been recorded matching your search or date range."
            actionLabel="Add Expense"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 dark:bg-dark-surface/50 border-b border-gray-100 dark:border-dark-border text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Paid By</th>
                  <th className="px-5 py-3.5 text-right">Amount (₹)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {new Date(exp.expense_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      {exp.description}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-border">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center">
                          {exp.paid_by_name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {exp.paid_by_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-gray-900 dark:text-white">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                      {exp.can_edit ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setExpenseToEdit(exp)}
                            title="Edit expense"
                            className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(exp)}
                            title="Delete expense"
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddOpen || Boolean(expenseToEdit)}
        onClose={() => {
          setIsAddOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
        onSuccess={() => {
          fetchExpenses();
          window.dispatchEvent(new CustomEvent('expense-updated'));
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Individual Expense"
        message={`Are you sure you want to delete "${expenseToDelete?.description}" of ₹${expenseToDelete?.amount.toLocaleString('en-IN')}? This will adjust roommate contribution analytics.`}
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
