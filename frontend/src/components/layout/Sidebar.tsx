import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Scale,
  Users,
  Settings,
  PlusCircle,
  LogOut,
  ChevronDown,
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';

interface SidebarProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateGroup,
  onOpenJoinGroup,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const { groups, currentGroup, selectGroup } = useGroup();
  const navigate = useNavigate();
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = React.useState(false);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Individual Expenses', path: '/expenses', icon: Receipt },
    { name: 'Common Room Fund', path: '/fund', icon: PiggyBank },
    { name: 'Settlement Hub', path: '/settlements', icon: Scale },
    { name: 'Roommates & Groups', path: '/members', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
              R
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white">
                RoomMates
              </span>
              <span className="block text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest -mt-0.5">
                Expense SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Workspace / Group Selector */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-border relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
            Current Workspace
          </div>
          <button
            onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-dark-border hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50 dark:bg-dark-card text-left transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {currentGroup?.name || 'No Group Selected'}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {currentGroup ? `${currentGroup.member_count} members • ${currentGroup.user_role}` : 'Create or join a group'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 shrink-0 ml-1" />
          </button>

          {/* Group Dropdown */}
          {isGroupDropdownOpen && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl z-50 p-1.5 space-y-1">
              <div className="max-h-48 overflow-y-auto space-y-1">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      selectGroup(g.id);
                      setIsGroupDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      currentGroup?.id === g.id
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover'
                    }`}
                  >
                    <span className="truncate">{g.name}</span>
                    <span className="text-[10px] opacity-75 shrink-0 ml-2">{g.member_count} members</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-dark-border pt-1.5 mt-1 space-y-1">
                <button
                  onClick={() => {
                    setIsGroupDropdownOpen(false);
                    onOpenCreateGroup();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg font-medium"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create New Group</span>
                </button>
                <button
                  onClick={() => {
                    setIsGroupDropdownOpen(false);
                    onOpenJoinGroup();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg font-medium"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join with Invite Code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Card at bottom */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm"
                style={{ backgroundColor: user?.avatar_color || '#6366f1' }}
              >
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                  {user?.full_name}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
