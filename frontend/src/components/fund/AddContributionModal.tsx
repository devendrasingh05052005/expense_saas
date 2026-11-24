import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance?: number;
}

export const AddContributionModal: React.FC<AddContributionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance = 0,
}) => {
  const { user } = useAuth();
  const { currentGroup } = useGroup();
  const { success, error } = useToast();

  const [amount, setAmount] = useState<string>('2000');
  const [notes, setNotes] = useState<string>('Monthly Room Fund Contribution');
  const [contributionDate, setContributionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const parsedAmount = parseFloat(amount) || 0;
  const projectedBalance = currentBalance + parsedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    if (parsedAmount <= 0) {
      error('Please enter an amount greater than 0.');
      return;
    }

    setIsLoading(true);
    try {
      await api.addContribution(currentGroup.id, {
        amount: parsedAmount,
        notes: notes.trim(),
        contribution_date: contributionDate,
      });
      success(`Contributed ₹${parsedAmount.toLocaleString('en-IN')} to Common Fund!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to add contribution.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contribute to Common Room Fund"
      description="Pooled funds are kept completely separate from individual expenses."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance Preview */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Available Balance:</span>
            <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
              ₹{currentBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 dark:text-gray-400 block">After Contribution:</span>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-300">
              ₹{projectedBalance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* User identification */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Contributing as: <strong className="text-gray-800 dark:text-gray-200">{user?.full_name}</strong>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Contribution Amount in INR (₹) <span className="text-rose-500">*</span>
          </label>
          <Input
            currencyPrefix
            type="number"
            step="1"
            min="1"
            placeholder="e.g. 2000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={contributionDate}
            onChange={(e) => setContributionDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Note / Description
          </label>
          <Input
            type="text"
            placeholder="e.g. Monthly Common Deposit, Gas & Grocery pool"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            Contribute Funds
          </Button>
        </div>
      </form>
    </Modal>
  );
};
