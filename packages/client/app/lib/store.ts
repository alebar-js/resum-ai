import { create } from "zustand";

type ViewMode = "master" | "fork";

interface DiffState {
  original: string;
  refactored: string;
  resolved: string;
  isReviewing: boolean;
}

interface AppState {
  // Sidebar
  isSidebarOpen: boolean;
  searchQuery: string;
  
  // View mode
  viewMode: ViewMode;
  activeForkId: string | null;
  
  // Diff state
  diff: DiffState;
  
  // JD Input
  jobDescription: string;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveForkId: (id: string | null) => void;
  setJobDescription: (jd: string) => void;
  
  // Diff actions
  startDiffReview: (original: string, refactored: string) => void;
  keepChanges: () => void;
  undoChanges: () => void;
  clearDiff: () => void;
  updateResolved: (content: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isSidebarOpen: true,
  searchQuery: "",
  viewMode: "master",
  activeForkId: null,
  jobDescription: "",
  diff: {
    original: "",
    refactored: "",
    resolved: "",
    isReviewing: false,
  },
  
  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // View mode actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveForkId: (id) => set({ activeForkId: id, viewMode: id ? "fork" : "master" }),
  
  // JD actions
  setJobDescription: (jd) => set({ jobDescription: jd }),
  
  // Diff actions
  startDiffReview: (original, refactored) => set({
    diff: {
      original,
      refactored,
      resolved: refactored,
      isReviewing: true,
    },
  }),
  
  keepChanges: () => {
    const { diff } = get();
    set({
      diff: {
        ...diff,
        isReviewing: false,
      },
    });
  },
  
  undoChanges: () => {
    const { diff } = get();
    set({
      diff: {
        ...diff,
        resolved: diff.original,
        isReviewing: false,
      },
    });
  },
  
  clearDiff: () => set({
    diff: {
      original: "",
      refactored: "",
      resolved: "",
      isReviewing: false,
    },
  }),
  
  updateResolved: (content) => set((state) => ({
    diff: {
      ...state.diff,
      resolved: content,
    },
  })),
}));
