import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ActivityDrawer } from '../dashboard/ActivityDrawer';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { AddContributionModal } from '../fund/AddContributionModal';
import { AddFundExpenseModal } from '../fund/AddFundExpenseModal';
import { CreateGroupModal } from '../groups/CreateGroupModal';
import { JoinGroupModal } from '../groups/JoinGroupModal';
import { useGroup } from '../../context/GroupContext';
import { EmptyState } from '../common/EmptyState';
import { Building2, Plus, Users } from 'lucide-react';
import { Button } from '../common/Button';

export const DashboardLayout: React.FC = () => {
  const { currentGroup, groups, isLoadingGroups } = useGroup();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [isAddFundExpenseOpen, setIsAddFundExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 dark:bg-dark-bg transition-colors flex overflow-x-hidden w-full max-w-full">
      {/* Sidebar */}
      <Sidebar
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-h-[100dvh] min-w-0 w-full max-w-full overflow-x-hidden">
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onOpenAddFundExpense={() => setIsAddFundExpenseOpen(true)}
          onOpenAddContribution={() => setIsAddContributionOpen(true)}
          onToggleActivityDrawer={() => setIsActivityOpen(!isActivityOpen)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          {isLoadingGroups ? (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400">
              Loading workspace...
            </div>
          ) : !currentGroup && groups.length === 0 ? (
            <div className="max-w-md mx-auto my-12 text-center">
              <EmptyState
                icon={<Building2 className="w-8 h-8" />}
                title="Welcome to RoomMates!"
                description="To get started tracking expenses, create a room group or join an existing group with an invite code."
                actionLabel="Create First Group"
                actionIcon={<Plus className="w-4 h-4" />}
                onAction={() => setIsCreateGroupOpen(true)}
              />
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsJoinGroupOpen(true)}>
                  Have an Invite Code? Join Group
                </Button>
              </div>
            </div>
          ) : (
            <Outlet
              context={{
                openAddExpense: () => setIsAddExpenseOpen(true),
                openAddFundExpense: () => setIsAddFundExpenseOpen(true),
                openAddContribution: () => setIsAddContributionOpen(true),
                openCreateGroup: () => setIsCreateGroupOpen(true),
                openJoinGroup: () => setIsJoinGroupOpen(true),
              }}
            />
          )}
        </main>
      </div>

      {/* Activity Drawer */}
      <ActivityDrawer isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          // Triggers refresh via window event or refetch
          window.dispatchEvent(new CustomEvent('expense-updated'));
        }}
      />

      <AddContributionModal
        isOpen={isAddContributionOpen}
        onClose={() => setIsAddContributionOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('fund-updated'));
        }}
      />

      <AddFundExpenseModal
        isOpen={isAddFundExpenseOpen}
        onClose={() => setIsAddFundExpenseOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('fund-updated'));
        }}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
      />
    </div>
  );
};
