import { useAppStore } from "~/lib/store";
import { useJobPostingData } from "~/lib/queries";
import { JobPostingActionsMenu } from "./JobPostingActionsMenu";
import { ResumeWorkspace } from "./ResumeWorkspace";
import { SkillGapAnalysis } from "./SkillGapAnalysis";
import { ExportResume } from "./ExportResume";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { ComponentType } from "react";

type JobPostingView = "actions" | "resume" | "skillGaps" | "export" | "applied";

interface ViewConfig {
  component: ComponentType<any>;
  shouldShow: (context: ViewContext) => boolean;
  props?: (context: ViewContext) => Record<string, unknown>;
}

interface ViewContext {
  jobPostingView: JobPostingView | null;
  diffData: { isReviewing: boolean };
  jobPostingData: { data: unknown } | null | undefined;
  skillGapData: unknown;
  isLoading: boolean;
}

/**
 * View registry - maps view names to their components and display logic
 * 
 * IMPORTANT: Order matters! Views are checked in this order, so more specific
 * views should come before general fallback views.
 * 
 * To add a new view:
 * 1. Add the view name to the JobPostingView type in store.ts
 * 2. Add an entry here with component and shouldShow logic
 * 3. Create the component file
 */
const VIEW_REGISTRY: Array<[JobPostingView, ViewConfig]> = [
  // Specific views (checked first)
  [
    "skillGaps",
    {
      component: SkillGapAnalysis,
      shouldShow: (ctx) => {
        return ctx.jobPostingView === "skillGaps" && !!ctx.skillGapData;
      },
      props: (ctx) => ({
        data: ctx.skillGapData,
      }),
    },
  ],
  
  [
    "export",
    {
      component: ExportResume,
      shouldShow: (ctx) => ctx.jobPostingView === "export",
    },
  ],
 
  [
    "applied",
    {
      component: () => (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Mark as Applied
            </h2>
            <p className="text-sm text-muted-foreground">
              Coming soon
            </p>
          </div>
        </div>
      ),
      shouldShow: (ctx) => ctx.jobPostingView === "applied",
    },
  ],
  
  // Resume workspace (high priority - shows during diff review)
  [
    "resume",
    {
      component: ResumeWorkspace,
      shouldShow: (ctx) => {
        // Show resume workspace when:
        // - In diff review mode, OR
        // - View is explicitly set to "resume", OR
        // - View is unset (null) AND resume data exists
        return (
          ctx.diffData.isReviewing ||
          ctx.jobPostingView === "resume" ||
          (ctx.jobPostingView === null && !!ctx.jobPostingData?.data)
        );
      },
    },
  ],
  
  // Actions menu (fallback - lowest priority)
  [
    "actions",
    {
      component: JobPostingActionsMenu,
      shouldShow: (ctx) => {
        // Show actions menu when:
        // - View is explicitly set to "actions", OR
        // - No view is set AND not in diff review AND no resume data
        return (
          (ctx.jobPostingView === "actions" || 
           (!ctx.jobPostingView && !ctx.diffData.isReviewing && !ctx.jobPostingData?.data)) &&
          !ctx.diffData.isReviewing &&
          !ctx.jobPostingData?.data
        );
      },
    },
  ],
];

/**
 * JobPostingWorkspace - Parent container for job posting workspace views
 * 
 * Uses a view registry pattern to determine which component to render.
 * This makes it easy to add new views without cluttering the component logic.
 */
export function JobPostingWorkspace() {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const diffData = useAppStore((state) => state.diffData);
  const jobPostingView = useAppStore((state) => state.jobPostingView);
  const setJobPostingView = useAppStore((state) => state.setJobPostingView);
  const skillGapData = useAppStore((state) => state.skillGapData);
  const setSkillGapData = useAppStore((state) => state.setSkillGapData);
  const { data: jobPostingData, isLoading } = useJobPostingData(activeJobPostingId ?? "");

  // Track previous job posting ID to detect changes
  const previousJobPostingIdRef = useRef<string | null>(null);

  // Reset view and clear skill gap data when job posting changes
  useEffect(() => {
    const previousId = previousJobPostingIdRef.current;
    const currentId = activeJobPostingId;

    // Only reset when the job posting ID actually changes
    if (previousId !== currentId) {
      previousJobPostingIdRef.current = currentId;
      
      // Clear skill gap data when switching job postings
      setSkillGapData(null);
      
      // Reset view to null so it can be auto-set based on state
      setJobPostingView(null);
    }
  }, [activeJobPostingId, setSkillGapData, setJobPostingView]);

  // Auto-set view only when view is null (not explicitly set by user)
  useEffect(() => {
    if (activeJobPostingId && jobPostingView === null) {
      // Auto-set view based on state only when view is not explicitly set
      if (diffData.isReviewing) {
        setJobPostingView("resume");
      } else if (jobPostingData?.data) {
        setJobPostingView("resume");
      } else {
        setJobPostingView("actions");
      }
    }
  }, [activeJobPostingId, jobPostingView, diffData.isReviewing, jobPostingData?.data, setJobPostingView]);

  // Build view context for routing logic
  const viewContext: ViewContext = useMemo(
    () => ({
      jobPostingView: jobPostingView as JobPostingView | null,
      diffData,
      jobPostingData,
      skillGapData,
      isLoading,
    }),
    [jobPostingView, diffData, jobPostingData, skillGapData, isLoading]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Find the first view that should be shown (checked in priority order)
  const activeView = VIEW_REGISTRY.find(([_, config]) =>
    config.shouldShow(viewContext)
  );

  if (activeView) {
    const [viewName, config] = activeView;
    const Component = config.component;
    const props = config.props ? config.props(viewContext) : {};
    
    return <Component {...props} />;
  }

  // Fallback: show actions menu if nothing matches
  return <JobPostingActionsMenu />;
}

