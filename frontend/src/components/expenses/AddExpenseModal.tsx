import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Expense } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
}

const CATEGORIES = [
  'Groceries',
  'Utilities (Gas/Water/Power)',
  'WiFi & Broadband',
  'Household & Cleaning',
  'Food & Dining',
  'Maintenance & Repairs',
  'General',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
}) => {
  const { user } = useAuth();
  const { currentGroup } = useGroup();
  const { success, error } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Groceries');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(String(expenseToEdit.amount));
      setDescription(expenseToEdit.description);
      setCategory(expenseToEdit.category);
      setExpenseDate(expenseToEdit.expense_date);
    } else {
      setAmount('');
      setDescription('');
      setCategory('Groceries');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
  }, [expenseToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) {
      error('Please select or create a group first.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error('Please enter a valid amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      error('Please enter a description for the expense.');
      return;
    }

    setIsLoading(true);
    try {
      if (expenseToEdit) {
        await api.updateExpense(currentGroup.id, expenseToEdit.id, {
          amount: parsedAmount,
          description: description.trim(),
          category,
          expense_date: expenseDate,
        });
        success('Expense updated successfully!');
      } else {
        await api.addExpense(currentGroup.id, {
          amount: parsedAmount,
          description: description.trim(),
          category,
          expense_date: expenseDate,
        });
        success(`₹${parsedAmount.toLocaleString('en-IN')} expense added!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save expense.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Personal Expense' : 'Add Personal Expense'}
      description="Record an expense paid individually from your pocket."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Identity notice */}
        <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Paid by:</span>
          <span className="font-semibold text-brand-700 dark:text-brand-300">
            {user?.full_name} ({user?.email})
          </span>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            1. Date <span className="text-rose-500">*</span>
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
            2. Amount in INR (₹) <span className="text-rose-500">*</span>
          </label>
          <Input
            currencyPrefix
            type="number"
            step="0.01"
            min="0.01"
            placeholder="e.g. 500"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            3. Description <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Milk, Atta, Vegetables, Gas, Electricity"
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
            {CATEGORIES.map((cat) => (
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
          <Button type="submit" isLoading={isLoading}>
            {expenseToEdit ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
