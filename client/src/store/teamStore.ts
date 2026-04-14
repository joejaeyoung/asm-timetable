import { create } from 'zustand';
import type { Team, TeamMembership, User } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from './authStore';

function requireCurrentUser() {
  const user = useAuthStore.getState().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user;
}

interface TeamStore {
  allUsers: User[];
  teams: Team[];
  memberships: TeamMembership[];
  currentTeamId: string | null;

  fetchMyTeams: (userId: string) => Promise<void>;
  createTeam: (name: string, description?: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, email: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  setCurrentTeam: (teamId: string) => void;

  getTeamMembers: (teamId: string) => User[];
  getCurrentTeam: () => Team | null;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  allUsers: [],
  teams: [],
  memberships: [],
  currentTeamId: null,

  fetchMyTeams: async (userId: string) => {
    const teams = await api.getMyTeams(userId);

    // Fetch members for all teams in parallel
    const memberResponses = await Promise.all(teams.map((t) => api.getTeamMembers(t.id)));

    // Aggregate unique users + memberships
    const userMap = new Map<string, User>();
    const memberships: TeamMembership[] = [];

    memberResponses.flat().forEach((mr) => {
      userMap.set(mr.user.id, mr.user);
      memberships.push({
        teamId: mr.teamId,
        userId: mr.user.id,
        role: mr.role,
        joinedAt: mr.joinedAt,
      });
    });

    set({
      teams,
      allUsers: Array.from(userMap.values()),
      memberships,
    });
  },

  createTeam: async (name: string, description?: string) => {
    const currentUser = requireCurrentUser();
    await api.createTeam(name, description);
    await get().fetchMyTeams(currentUser.id);
  },

  deleteTeam: async (teamId: string) => {
    const currentUser = requireCurrentUser();
    await api.deleteTeam(teamId);
    await get().fetchMyTeams(currentUser.id);
    set((state) => ({
      currentTeamId: state.currentTeamId === teamId ? null : state.currentTeamId,
    }));
  },

  inviteMember: async (teamId: string, email: string) => {
    const currentUser = requireCurrentUser();
    await api.inviteMember(teamId, email);
    await get().fetchMyTeams(currentUser.id);
  },

  removeMember: async (teamId: string, userId: string) => {
    const currentUser = requireCurrentUser();
    await api.removeMember(teamId, userId);
    await get().fetchMyTeams(currentUser.id);
  },

  setCurrentTeam: (teamId: string) => set({ currentTeamId: teamId }),

  getTeamMembers: (teamId: string): User[] => {
    const { allUsers, memberships } = get();
    const memberIds = new Set(
      memberships.filter((m) => m.teamId === teamId).map((m) => m.userId),
    );
    return allUsers.filter((u) => memberIds.has(u.id));
  },

  getCurrentTeam: (): Team | null => {
    const { teams, currentTeamId } = get();
    return teams.find((t) => t.id === currentTeamId) ?? null;
  },
}));
