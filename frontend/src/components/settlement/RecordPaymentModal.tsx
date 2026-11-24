import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { SettlementTransfer } from '../../types';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTransfer?: SettlementTransfer | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTransfer,
}) => {
  const { user } = useAuth();
  const { currentGroup, members } = useGroup();
  const { success, error } = useToast();

  const [toUserId, setToUserId] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState<string>('Settlement payment');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const eligibleRecipients = members.filter((m) => m.user_id !== user?.id);

  useEffect(() => {
    if (initialTransfer) {
      setToUserId(initialTransfer.to_user_id);
      setAmount(String(initialTransfer.amount));
      setNotes(`Settlement to ${initialTransfer.to_user_name}`);
    } else if (eligibleRecipients.length > 0) {
      setToUserId(eligibleRecipients[0].user_id);
      setAmount('');
      setNotes('Settlement payment');
    }
  }, [initialTransfer, isOpen, members, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error('Please enter a valid payment amount.');
      return;
    }

    if (!toUserId) {
      error('Please select a recipient.');
      return;
    }

    setIsLoading(true);
    try {
      await api.recordSettlementPayment(currentGroup.id, {
        to_user_id: toUserId,
        amount: parsedAmount,
        payment_method: paymentMethod,
        notes: notes.trim(),
        payment_date: paymentDate,
      });
      success(`Recorded payment of ₹${parsedAmount.toLocaleString('en-IN')}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Settlement Payment"
      description="Mark an individual expense debt as settled via UPI, Cash, or Transfer."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payer info */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border text-xs flex justify-between">
          <span className="text-gray-500">Payer:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{user?.full_name} (You)</span>
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Paid To (Recipient) <span className="text-rose-500">*</span>
          </label>
          <select
            value={toUserId}
            onChange={(e) => setToUserId(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {eligibleRecipients.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name} ({m.email})
              </option>
            ))}
          </select>
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
            placeholder="e.g. 1000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="Cash">Cash Handover</option>
            <option value="Bank Transfer">IMPS / NEFT Transfer</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Payment Date
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Notes / Reference
          </label>
          <Input
            type="text"
            placeholder="e.g. Cleared November rent & milk share"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            Confirm Settlement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
