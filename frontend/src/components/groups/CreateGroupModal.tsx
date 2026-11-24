import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useGroup } from '../../context/GroupContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { refreshGroups, selectGroup } = useGroup();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Group name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const newGroup = await api.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        currency: 'INR',
      });
      success(`Created workspace: ${newGroup.name}`);
      await refreshGroups();
      selectGroup(newGroup.id);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to create group.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Expense Group"
      description="Create a dedicated, private workspace for roommates, friends, or family."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Group / Room Name <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. Bhopal Room, Flat 302, Hostel Friends"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Description (Optional)
          </label>
          <Input
            placeholder="e.g. Monthly flat expenses and grocery fund"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border text-xs text-gray-500">
          Currency: <strong className="text-gray-800 dark:text-gray-200">Indian Rupee (INR - ₹)</strong>. You will automatically be designated as Group Admin.
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
