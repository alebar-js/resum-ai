import { create } from "zustand";
import type { ResumeProfile } from "@app/shared";

type ViewMode = "master" | "jobPosting";

interface DiffState {
  original: string;
  refactored: string;
  resolved: string;
  isReviewing: boolean;
}

interface DiffDataState {
  original: ResumeProfile | null;
  refactored: ResumeProfile | null;
  resolved: ResumeProfile | null;
  isReviewing: boolean;
  acceptedChanges: Record<string, boolean>; // Map of change paths to acceptance status (true = accepted, false = rejected, undefined = pending)
}

interface AppState {
  // Sidebar
  isSidebarOpen: boolean;
  searchQuery: string;
  
  // View mode
  viewMode: ViewMode;
  activeJobPostingId: string | null;
  
  // Diff state (legacy - Markdown)
  diff: DiffState;
  
  // Diff data state (new - JSON)
  diffData: DiffDataState;
  
  // JD Input
  jobDescription: string;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveJobPostingId: (id: string | null) => void;
  setJobDescription: (jd: string) => void;
  
  // Diff actions (legacy - Markdown)
  startDiffReview: (original: string, refactored: string) => void;
  keepChanges: () => void;
  undoChanges: () => void;
  clearDiff: () => void;
  updateResolved: (content: string) => void;
  
  // Diff data actions (new - JSON)
  startDiffReviewData: (original: ResumeProfile, refactored: ResumeProfile) => void;
  keepChangesData: () => void;
  undoChangesData: () => void;
  clearDiffData: () => void;
  updateResolvedData: (data: ResumeProfile) => void;
  acceptChange: (changePath: string) => void;
  rejectChange: (changePath: string) => void;
  resetChangeDecision: (changePath: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isSidebarOpen: true,
  searchQuery: "",
  viewMode: "master",
  activeJobPostingId: null,
  jobDescription: "",
  diff: {
    original: "",
    refactored: "",
    resolved: "",
    isReviewing: false,
  },
  diffData: {
    original: null,
    refactored: null,
    resolved: null,
    isReviewing: false,
    acceptedChanges: {},
  },
  
  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // View mode actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveJobPostingId: (id) => set({ activeJobPostingId: id, viewMode: id ? "jobPosting" : "master" }),
  
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
  
  // Diff data actions (new - JSON)
  startDiffReviewData: (original, refactored) => set({
    diffData: {
      original,
      refactored,
      resolved: refactored,
      isReviewing: true,
      acceptedChanges: {},
    },
  }),
  
  keepChangesData: () => {
    const { diffData } = get();
    set({
      diffData: {
        ...diffData,
        isReviewing: false,
      },
    });
  },
  
  undoChangesData: () => {
    const { diffData } = get();
    set({
      diffData: {
        ...diffData,
        resolved: diffData.original,
        isReviewing: false,
      },
    });
  },
  
  clearDiffData: () => set({
    diffData: {
      original: null,
      refactored: null,
      resolved: null,
      isReviewing: false,
      acceptedChanges: {},
    },
  }),
  
  updateResolvedData: (data) => set((state) => ({
    diffData: {
      ...state.diffData,
      resolved: data,
    },
  })),
  
  acceptChange: (changePath) => set((state) => ({
    diffData: {
      ...state.diffData,
      acceptedChanges: {
        ...state.diffData.acceptedChanges,
        [changePath]: true,
      },
    },
  })),
  
  rejectChange: (changePath) => set((state) => ({
    diffData: {
      ...state.diffData,
      acceptedChanges: {
        ...state.diffData.acceptedChanges,
        [changePath]: false,
      },
    },
  })),
  
  resetChangeDecision: (changePath) => set((state) => {
    const { [changePath]: _, ...rest } = state.diffData.acceptedChanges;
    return {
      diffData: {
        ...state.diffData,
        acceptedChanges: rest,
      },
    };
  }),
}));
