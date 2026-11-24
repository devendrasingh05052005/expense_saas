import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  Building2,
  Share2,
  MoreVertical
} from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { GroupMember } from '../types';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { InviteMemberModal } from '../components/groups/InviteMemberModal';

export const MembersPage: React.FC = () => {
  const { currentGroup, members, refreshMembers } = useGroup();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  const isAdmin = currentGroup?.user_role === 'admin' || currentGroup?.user_role === 'co-admin';

  const handleCopyCode = () => {
    if (currentGroup?.invite_code) {
      navigator.clipboard.writeText(currentGroup.invite_code);
      setHasCopiedCode(true);
      success('Invite code copied to clipboard!');
      setTimeout(() => setHasCopiedCode(false), 2000);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!currentGroup || !memberToRemove) return;
    setIsRemoving(true);
    try {
      await api.removeMember(currentGroup.id, memberToRemove.user_id);
      success(`Removed ${memberToRemove.full_name} from group.`);
      setMemberToRemove(null);
      refreshMembers();
    } catch (err: any) {
      error(err.message || 'Failed to remove member.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!currentGroup) return;
    try {
      await api.updateGroup(currentGroup.id, { user_id: userId, role: newRole });
      success('Member role updated.');
      refreshMembers();
    } catch (err: any) {
      error(err.message || 'Failed to change role.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Roommates & Members
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage members of <strong className="text-gray-800 dark:text-gray-200">{currentGroup?.name}</strong>. Dynamic support for any number of roommates.
          </p>
        </div>

        <Button onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
          Invite Roommate
        </Button>
      </div>

      {/* Group Invite Code Banner */}
      <div className="p-5 rounded-2xl border border-brand-200 dark:border-brand-800 bg-gradient-to-r from-brand-500/10 via-indigo-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 block mb-1">
            Room Invite Code
          </span>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Roommates can register their own accounts and join this group instantly using this code:
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-brand-200 dark:border-brand-800 font-mono text-sm font-extrabold tracking-widest text-brand-600 dark:text-brand-300 shadow-xs">
            {currentGroup?.invite_code}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCode}
            leftIcon={hasCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {hasCopiedCode ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            Current Members ({members.length})
          </h3>
          <span className="text-xs text-gray-400">
            Your role: <strong className="text-brand-600 dark:text-brand-400 uppercase font-bold">{currentGroup?.user_role}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 dark:bg-dark-surface/50 border-b border-gray-100 dark:border-dark-border text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Joined On</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {members.map((m) => {
                const isCurrentUser = m.user_id === user?.id;
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: m.avatar_color || '#6366f1' }}
                        >
                          {m.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{m.full_name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/50 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                      {m.email}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          m.role === 'admin'
                            ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800'
                            : m.role === 'co-admin'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                            : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border'
                        }`}
                      >
                        {m.role === 'admin' ? 'Group Admin' : m.role === 'co-admin' ? 'Co-Admin' : 'Member'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                      {new Date(m.joined_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                      {isAdmin && !isCurrentUser && m.role !== 'admin' ? (
                        <button
                          onClick={() => setMemberToRemove(m)}
                          title="Remove member"
                          className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={refreshMembers}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Group Member"
        message={`Are you sure you want to remove ${memberToRemove?.full_name} from ${currentGroup?.name}?`}
        confirmLabel="Yes, Remove"
        isLoading={isRemoving}
      />
    </div>
  );
};
