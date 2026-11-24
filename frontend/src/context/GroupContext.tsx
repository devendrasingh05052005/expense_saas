import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Group, GroupMember } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface GroupContextType {
  groups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  isLoadingGroups: boolean;
  fromDate: string;
  toDate: string;
  setFilterRange: (from: string, to: string) => void;
  resetFilterRange: () => void;
  selectGroup: (groupId: number) => void;
  refreshGroups: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);

  // Date range filter state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const refreshGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setCurrentGroup(null);
      setIsLoadingGroups(false);
      return;
    }

    try {
      setIsLoadingGroups(true);
      const data = await api.getGroups();
      setGroups(data);

      const savedGroupId = localStorage.getItem('active_group_id');
      let target = data.find((g: Group) => String(g.id) === savedGroupId);
      if (!target && data.length > 0) {
        target = data[0];
      }

      if (target) {
        setCurrentGroup(target);
        localStorage.setItem('active_group_id', String(target.id));
      } else {
        setCurrentGroup(null);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user]);

  const refreshMembers = useCallback(async () => {
    if (!currentGroup) {
      setMembers([]);
      return;
    }
    try {
      const data = await api.getMembers(currentGroup.id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [currentGroup]);

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  useEffect(() => {
    if (currentGroup) {
      refreshMembers();
    }
  }, [currentGroup, refreshMembers]);

  const selectGroup = (groupId: number) => {
    const target = groups.find((g) => g.id === groupId);
    if (target) {
      setCurrentGroup(target);
      localStorage.setItem('active_group_id', String(target.id));
    }
  };

  const setFilterRange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
  };

  const resetFilterRange = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        currentGroup,
        members,
        isLoadingGroups,
        fromDate,
        toDate,
        setFilterRange,
        resetFilterRange,
        selectGroup,
        refreshGroups,
        refreshMembers,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroup must be used within GroupProvider');
  return context;
};
