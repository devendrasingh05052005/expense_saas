import React, { useState } from 'react';
import { Copy, Check, Mail, Shield } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentGroup } = useGroup();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const inviteCode = currentGroup?.invite_code || '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setHasCopied(true);
    success('Invite code copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    if (!email.trim()) {
      error('Please enter an email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.inviteMember(currentGroup.id, {
        email: email.trim(),
        role,
      });
      success(res.message);
      setEmail('');
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to send invite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add or Invite Roommates"
      description={`Invite members to join '${currentGroup?.name}'. There is no limit on members.`}
    >
      <div className="space-y-5">
        {/* Shareable Invite Code Card */}
        <div className="p-4 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
          <span className="text-xs font-semibold text-brand-900 dark:text-brand-300 block mb-1">
            Group Invite Code
          </span>
          <p className="text-xs text-brand-700 dark:text-brand-400 mb-3">
            Share this code directly with your roommates so they can join instantly:
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-dark-card border border-brand-200 dark:border-brand-800 rounded-lg px-3 py-2 font-mono text-sm font-bold tracking-widest text-brand-600 dark:text-brand-300 select-all">
              {inviteCode}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              leftIcon={hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {hasCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Invite by Email */}
        <form onSubmit={handleInvite} className="space-y-4 pt-1 border-t border-gray-100 dark:border-dark-border">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
            Or Invite via Email
          </span>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Roommate Email Address <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="roommate@example.com"
              required
              prefixIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="member">Member (Can add & view expenses and funds)</option>
              <option value="co-admin">Co-Admin (Can manage transactions & invite members)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Close
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
