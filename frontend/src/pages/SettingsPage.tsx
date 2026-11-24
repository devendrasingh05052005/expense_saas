import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Sparkles,
  Save,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const SettingsPage: React.FC = () => {
  const { currentGroup, refreshGroups } = useGroup();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [groupName, setGroupName] = useState(currentGroup?.name || '');
  const [description, setDescription] = useState(currentGroup?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const isAdmin = currentGroup?.user_role === 'admin' || currentGroup?.user_role === 'co-admin';

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    setIsSaving(true);
    try {
      await api.updateGroup(currentGroup.id, {
        name: groupName.trim(),
        description: description.trim() || undefined,
      });
      success('Group settings updated.');
      refreshGroups();
    } catch (err: any) {
      error(err.message || 'Failed to update group.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedDemo();
      success(res.message);
      refreshGroups();
      window.dispatchEvent(new CustomEvent('expense-updated'));
      window.dispatchEvent(new CustomEvent('fund-updated'));
    } catch (err: any) {
      error(err.message || 'Failed to seed demo data.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Workspace Settings
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Manage workspace configuration, theme preferences, and account info.
        </p>
      </div>

      {/* Group Configuration Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100 dark:border-dark-border">
          <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Group Information
            </h3>
            <p className="text-xs text-gray-400">
              Update group details visible to all roommates
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Group Name
            </label>
            <Input
              disabled={!isAdmin}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <Input
              disabled={!isAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Currency
            </label>
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-dark-surface p-2.5 rounded-xl border border-gray-200 dark:border-dark-border font-mono">
              INR - Indian Rupee (₹)
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Group Settings
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Appearance Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Appearance & Theme
              </h3>
              <p className="text-xs text-gray-400">
                Current theme is {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleTheme}
            leftIcon={theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100 dark:border-dark-border">
          <User className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            User Account Details
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span className="text-gray-500">Full Name:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{user?.full_name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span className="text-gray-500">Email Address:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Verification Status:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
