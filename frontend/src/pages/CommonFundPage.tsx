import React, { useEffect, useState, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Percent
} from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { FundSummary, FundTransaction } from '../types';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { AddContributionModal } from '../components/fund/AddContributionModal';
import { AddFundExpenseModal } from '../components/fund/AddFundExpenseModal';

export const CommonFundPage: React.FC = () => {
  const { currentGroup, fromDate, toDate } = useGroup();
  const { success, error } = useToast();

  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<FundTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<FundTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFundData = useCallback(async () => {
    if (!currentGroup) return;
    setIsLoading(true);
    try {
      const [sumData, txData] = await Promise.all([
        api.getFundSummary(currentGroup.id),
        api.getFundTransactions(currentGroup.id, {
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        }),
      ]);
      setSummary(sumData);
      setTransactions(txData);
    } catch (err: any) {
      error(err.message || 'Failed to load common fund data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup, fromDate, toDate]);

  useEffect(() => {
    fetchFundData();
  }, [fetchFundData]);

  const handleDeleteConfirm = async () => {
    if (!currentGroup || !txToDelete) return;
    setIsDeleting(true);
    try {
      if (txToDelete.transaction_type === 'expense') {
        const res = await api.deleteFundExpense(currentGroup.id, txToDelete.id);
        success(res.message);
      } else {
        const res = await api.deleteFundContribution(currentGroup.id, txToDelete.id);
        success(res.message);
      }
      setTxToDelete(null);
      fetchFundData();
      window.dispatchEvent(new CustomEvent('fund-updated'));
    } catch (err: any) {
      error(err.message || 'Failed to delete transaction.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Common Room Fund
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Isolated Pool Module
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage shared money pooled together for collective purchases (Milk, Atta, Gas, Veggies).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsContributionOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-emerald-500" />}
          >
            Contribute Fund
          </Button>
          <Button
            onClick={() => setIsExpenseOpen(true)}
            leftIcon={<PiggyBank className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Spend Fund Money
          </Button>
        </div>
      </div>

      {/* Fund Dashboard Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available Balance Card */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Available Pool Balance
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                ₹
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 tracking-tight">
              ₹{summary.available_balance.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Ready for shared household groceries & bills
            </div>
          </div>

          {/* Total Contributed Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Contributed
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{summary.total_contributed.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-xs text-gray-500">Total money deposited into pool</div>
          </div>

          {/* Total Spent Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Fund Spent
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{summary.total_spent.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-xs text-gray-500">Deducted from shared pool</div>
          </div>

          {/* Fund Utilization Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Fund Utilization
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.utilization_percentage}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${Math.min(summary.utilization_percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Individual Contributions Breakdown */}
      {summary && summary.member_contributions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
            Individual Contributions to Common Pool
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {summary.member_contributions.map((mc) => (
              <div
                key={mc.user_id}
                className="p-3.5 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: mc.avatar_color || '#6366f1' }}
                  >
                    {mc.user_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                      {mc.user_name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {mc.percentage}% of pool deposits
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  ₹{mc.total_contributed.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History & Ledger */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              Common Fund Transaction Ledger
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Accurate chronological running balance ledger showing deposits and debits.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {transactions.length} records
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading fund transactions...</div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="w-8 h-8 text-emerald-500" />}
            title="Common fund is empty"
            description="Contribute initial pooled funds from all roommates to get started."
            actionLabel="Contribute First ₹2,000"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={() => setIsContributionOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 dark:bg-dark-surface/50 border-b border-gray-100 dark:border-dark-border text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Added By</th>
                  <th className="px-5 py-3.5 text-right">Amount (₹)</th>
                  <th className="px-5 py-3.5 text-right">Balance After (₹)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {transactions.map((tx) => {
                  const isContribution = tx.transaction_type === 'contribution';
                  return (
                    <tr
                      key={`${tx.transaction_type}-${tx.id}`}
                      className="hover:bg-gray-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                        <div>{tx.description}</div>
                        {tx.category && tx.category !== 'Contribution' && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {tx.category}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isContribution
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isContribution ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" />
                              Contribution
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              Expense
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-300">
                        {tx.user_name}
                      </td>
                      <td
                        className={`px-5 py-4 whitespace-nowrap text-right font-bold text-sm ${
                          isContribution
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isContribution ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${tx.amount.toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-gray-900 dark:text-white text-xs">
                        ₹{tx.running_balance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                        {tx.can_edit ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.transaction_type === 'expense' && (
                              <button
                                onClick={() => setTransactionToEdit(tx)}
                                title="Edit fund expense"
                                className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setTxToDelete(tx)}
                              title="Delete transaction"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddContributionModal
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
        currentBalance={summary?.available_balance || 0}
        onSuccess={() => {
          fetchFundData();
          window.dispatchEvent(new CustomEvent('fund-updated'));
        }}
      />

      <AddFundExpenseModal
        isOpen={isExpenseOpen || Boolean(transactionToEdit)}
        onClose={() => {
          setIsExpenseOpen(false);
          setTransactionToEdit(null);
        }}
        currentBalance={summary?.available_balance || 0}
        transactionToEdit={transactionToEdit}
        onSuccess={() => {
          fetchFundData();
          window.dispatchEvent(new CustomEvent('fund-updated'));
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Fund ${txToDelete?.transaction_type === 'expense' ? 'Expense' : 'Contribution'}`}
        message={
          txToDelete?.transaction_type === 'expense'
            ? `Deleting "${txToDelete?.description}" will refund ₹${txToDelete?.amount.toLocaleString('en-IN')} back to the available fund balance.`
            : `Are you sure you want to delete this contribution of ₹${txToDelete?.amount.toLocaleString('en-IN')}?`
        }
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
