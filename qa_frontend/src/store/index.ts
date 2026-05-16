import { create } from 'zustand';

export interface GlobalState {
  environment: string;
  setEnvironment: (env: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  environment: 'Production',
  setEnvironment: (env) => set({ environment: env }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
