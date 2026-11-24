import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { FundTransaction } from '../../types';

interface AddFundExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance?: number;
  transactionToEdit?: FundTransaction | null;
}

const FUND_CATEGORIES = [
  'Groceries (Milk, Veggies, Atta, Oil)',
  'Utilities (Gas Cylinder, Water, Electric)',
  'Household Supplies & Cleaning',
  'Common Snacks & Tea',
  'Flat Maintenance',
  'Other Shared Spend',
];

export const AddFundExpenseModal: React.FC<AddFundExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance = 0,
  transactionToEdit,
}) => {
  const { user } = useAuth();
  const { currentGroup } = useGroup();
  const { success, error } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Groceries (Milk, Veggies, Atta, Oil)');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (transactionToEdit) {
      setAmount(String(transactionToEdit.amount));
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category || 'Groceries');
      setExpenseDate(transactionToEdit.date);
    } else {
      setAmount('');
      setDescription('');
      setCategory('Groceries (Milk, Veggies, Atta, Oil)');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
  }, [transactionToEdit, isOpen]);

  const parsedAmount = parseFloat(amount) || 0;
  const isOverBalance = !transactionToEdit && parsedAmount > currentBalance;
  const remainingProjected = currentBalance - parsedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    if (parsedAmount <= 0) {
      error('Please enter a valid amount greater than 0.');
      return;
    }

    if (isOverBalance) {
      error(`Cannot spend more than available balance (₹${currentBalance.toLocaleString('en-IN')})!`);
      return;
    }

    if (!description.trim()) {
      error('Please enter what was purchased.');
      return;
    }

    setIsLoading(true);
    try {
      if (transactionToEdit) {
        await api.updateFundExpense(currentGroup.id, transactionToEdit.id, {
          amount: parsedAmount,
          description: description.trim(),
          category,
          expense_date: expenseDate,
        });
        success('Fund expense updated!');
      } else {
        await api.addFundExpense(currentGroup.id, {
          amount: parsedAmount,
          description: description.trim(),
          category,
          expense_date: expenseDate,
        });
        success(`Spent ₹${parsedAmount.toLocaleString('en-IN')} from Common Fund.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to record fund expense.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Common Fund Expense' : 'Spend From Common Fund'}
      description="Purchases made using the shared pool money. Deducts directly from available fund."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance Status Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            isOverBalance
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200'
          }`}
        >
          <div>
            <span className="opacity-75 block">Available Pool Balance:</span>
            <span className="font-bold text-sm">₹{currentBalance.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-right">
            <span className="opacity-75 block">Balance After Spend:</span>
            <span className={`font-bold text-sm ${isOverBalance ? 'text-rose-600 font-extrabold' : ''}`}>
              ₹{remainingProjected.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {isOverBalance && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Spending cannot exceed available common balance of ₹{currentBalance.toLocaleString('en-IN')}.</span>
          </div>
        )}

        {/* User identification */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Purchased by: <strong className="text-gray-800 dark:text-gray-200">{user?.full_name}</strong>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Amount in INR (₹) <span className="text-rose-500">*</span>
          </label>
          <Input
            currencyPrefix
            type="number"
            step="0.01"
            min="0.01"
            max={currentBalance > 0 ? currentBalance : undefined}
            placeholder="e.g. 100, 200, 900"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Description <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Milk, Atta, Vegetables, Gas Cylinder"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {FUND_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isOverBalance || currentBalance <= 0}
            className="bg-brand-600 hover:bg-brand-700"
          >
            {transactionToEdit ? 'Save Changes' : 'Deduct from Fund'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
