import React, { useEffect, useState, useCallback } from 'react';
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  CreditCard,
  Trash2,
  Calendar,
  Sparkles,
  Receipt
} from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { SettlementSummary, SettlementTransfer, SettlementPayment } from '../types';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { RecordPaymentModal } from '../components/settlement/RecordPaymentModal';

export const SettlementsPage: React.FC = () => {
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [settlementData, setSettlementData] = useState<SettlementSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [activeTransfer, setActiveTransfer] = useState<SettlementTransfer | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SettlementPayment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSettlements = useCallback(async () => {
    if (!currentGroup) return;
    setIsLoading(true);
    try {
      const data = await api.getSettlements(currentGroup.id);
      setSettlementData(data);
    } catch (err: any) {
      error(err.message || 'Failed to calculate settlements.');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Listen for updates
  useEffect(() => {
    const handleRefresh = () => fetchSettlements();
    window.addEventListener('expense-updated', handleRefresh);
    return () => window.removeEventListener('expense-updated', handleRefresh);
  }, [fetchSettlements]);

  const handleDeletePayment = async () => {
    if (!currentGroup || !paymentToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteSettlementPayment(currentGroup.id, paymentToDelete.id);
      success('Settlement payment deleted.');
      setPaymentToDelete(null);
      fetchSettlements();
    } catch (err: any) {
      error(err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettleSuggested = (transfer: SettlementTransfer) => {
    setActiveTransfer(transfer);
    setIsRecordOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Automatic Settlement Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Algorithm Powered
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Calculates fair share of individual out-of-pocket expenses and simplifies peer-to-peer debts.
          </p>
        </div>

        <Button
          onClick={() => {
            setActiveTransfer(null);
            setIsRecordOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Record Settlement Payment
        </Button>
      </div>

      {/* Fair Share Metric Overview */}
      {settlementData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Individual Expenses
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              ₹{settlementData.total_individual_expenses.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-400 mt-1">Across all group roommates</div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Roommates
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {settlementData.member_count} members
            </div>
            <div className="text-xs text-gray-400 mt-1">Sharing expenses equally</div>
          </div>

          <div className="rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              Fair Share per Member
            </span>
            <div className="text-2xl font-extrabold text-brand-900 dark:text-brand-200 mt-2">
              ₹{settlementData.fair_share_per_member.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-400 mt-1">Equal split baseline</div>
          </div>
        </div>
      )}

      {/* Roommate Net Balances Grid */}
      {settlementData && (
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
            Individual Net Balances
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {settlementData.member_balances.map((mb) => {
              const isOwed = mb.net_balance > 0.01;
              const owes = mb.net_balance < -0.01;
              const isSettled = !isOwed && !owes;

              return (
                <div
                  key={mb.user_id}
                  className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: mb.avatar_color || '#6366f1' }}
                      >
                        {mb.user_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {mb.user_name}
                        </div>
                        <div className="text-[11px] text-gray-400">{mb.email}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        isOwed
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : owes
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-border'
                      }`}
                    >
                      {isOwed ? 'Gets Back' : owes ? 'Owes Money' : 'Settled'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-dark-border text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Total Paid from Pocket:</span>
                      <strong className="text-gray-900 dark:text-white">
                        ₹{mb.total_paid.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Fair Share:</span>
                      <span>₹{mb.fair_share.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-sm font-bold">
                      <span className="text-gray-700 dark:text-gray-300">Net Balance:</span>
                      <span
                        className={
                          isOwed
                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : owes
                            ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                            : 'text-gray-500'
                        }
                      >
                        {isOwed
                          ? `+₹${mb.net_balance.toLocaleString('en-IN')}`
                          : owes
                          ? `-₹${Math.abs(mb.net_balance).toLocaleString('en-IN')}`
                          : '₹0.00 (All Clear)'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimized Suggested Debt Settlements */}
      {settlementData && (
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                Suggested Debt Transfers
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Minimal cash flow transfers required to achieve 100% fair split.
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>

          {settlementData.suggested_transfers.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                All individual expenses are completely settled!
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                No roommate owes any money to another roommate at this moment.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {settlementData.suggested_transfers.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/60 dark:bg-dark-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {t.from_user_name.charAt(0)}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {t.from_user_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
                      <span>owes</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>₹{t.amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {t.to_user_name}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {t.to_user_name.charAt(0)}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSettleSuggested(t)}
                    leftIcon={<CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    className="w-full sm:w-auto text-xs shrink-0"
                  >
                    Mark Paid via UPI
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settlement Payment Ledger History */}
      {settlementData && (
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              Recorded Settlement Payment History
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {settlementData.settlement_history.length} settlements
            </span>
          </div>

          {settlementData.settlement_history.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No settlement payments have been recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 dark:bg-dark-surface/50 border-b border-gray-100 dark:border-dark-border text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">From (Payer)</th>
                    <th className="px-5 py-3.5">To (Recipient)</th>
                    <th className="px-5 py-3.5">Method</th>
                    <th className="px-5 py-3.5">Notes</th>
                    <th className="px-5 py-3.5 text-right">Amount (₹)</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                  {settlementData.settlement_history.map((sp) => (
                    <tr
                      key={sp.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {new Date(sp.payment_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {sp.from_user_name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {sp.to_user_name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {sp.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {sp.notes || 'Settlement payment'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{sp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setPaymentToDelete(sp)}
                          title="Delete settlement record"
                          className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordOpen}
        onClose={() => {
          setIsRecordOpen(false);
          setActiveTransfer(null);
        }}
        initialTransfer={activeTransfer}
        onSuccess={fetchSettlements}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="Delete Settlement Record"
        message={`Are you sure you want to delete this payment record of ₹${paymentToDelete?.amount.toLocaleString('en-IN')}? This will reopen the debt in the calculation.`}
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
