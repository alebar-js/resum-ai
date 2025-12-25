import { create } from "zustand";
import type { ResumeProfile, SkillGapAnalysisResponse } from "@app/shared";

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

type Theme = "light" | "dark" | "system";

interface AppState {
  // Sidebar
  isSidebarOpen: boolean;
  searchQuery: string;
  
  // View mode
  viewMode: ViewMode;
  activeJobPostingId: string | null;
  
  // Theme
  theme: Theme;
  
  // Diff state (legacy - Markdown)
  diff: DiffState;
  
  // Diff data state (new - JSON)
  diffData: DiffDataState;
  
  // JD Input
  jobDescription: string;
  
  // Job Posting Workspace View
  jobPostingView: "actions" | "resume" | "skillGaps" | "export" | "applied" | null;
  
  // Skill Gap Analysis Data
  skillGapData: SkillGapAnalysisResponse | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveJobPostingId: (id: string | null) => void;
  setJobDescription: (jd: string) => void;
  setJobPostingView: (view: "actions" | "resume" | "skillGaps" | "export" | "applied" | null) => void;
  setSkillGapData: (data: AppState["skillGapData"]) => void;
  setTheme: (theme: Theme) => void;
  
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

// Initialize theme from localStorage or default to "system"
const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch (error) {
    console.error("Error reading theme from localStorage:", error);
  }
  return "system";
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isSidebarOpen: true,
  searchQuery: "",
  viewMode: "master",
  activeJobPostingId: null,
  theme: getInitialTheme(),
  jobDescription: "",
  jobPostingView: null,
  skillGapData: null,
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
  
  // Job posting view actions
  setJobPostingView: (view) => set({ jobPostingView: view }),
  setSkillGapData: (data) => set({ skillGapData: data }),
  
  // Theme actions
  setTheme: (theme) => {
    set({ theme });
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error saving theme to localStorage:", error);
    }
  },
  
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
