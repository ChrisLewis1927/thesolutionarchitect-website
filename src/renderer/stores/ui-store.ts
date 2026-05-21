// ArchLens — UI state management via Zustand
// Implemented in Task 15.1

import { create } from 'zustand';

export interface UIState {
  sidebarOpen: boolean;
  currentRoute: string;
  theme: 'light' | 'dark';
  navigationStartTime: number | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentRoute: (route: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  startNavigation: () => void;
  endNavigation: () => number;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  currentRoute: '/',
  theme: 'light',
  navigationStartTime: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setTheme: (theme) => set({ theme }),
  startNavigation: () => set({ navigationStartTime: performance.now() }),
  endNavigation: () => {
    const start = get().navigationStartTime;
    const elapsed = start !== null ? performance.now() - start : 0;
    set({ navigationStartTime: null });
    return elapsed;
  },
}));
