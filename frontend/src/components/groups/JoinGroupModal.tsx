import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose }) => {
  const { refreshGroups, selectGroup } = useGroup();
  const { success, error } = useToast();

  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      error('Please enter the invite code.');
      return;
    }

    setIsLoading(true);
    try {
      const joined = await api.joinGroup({ invite_code: inviteCode.trim().toUpperCase() });
      success(`Successfully joined ${joined.name}!`);
      await refreshGroups();
      selectGroup(joined.id);
      setInviteCode('');
      onClose();
    } catch (err: any) {
      error(err.message || 'Invalid or expired invite code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Existing Room Group"
      description="Enter the group's invite code shared by your roommate or group admin."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Invite Code <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. FLAT302 or ROOM8X2A"
            required
            className="uppercase font-mono tracking-widest text-center text-base font-bold"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Join Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
