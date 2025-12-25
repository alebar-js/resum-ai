import { useAppStore } from "~/lib/store";
import { ResizablePane } from "~/components/ui/resizable";
import { JobDescriptionPanel } from "./JobDescriptionPanel";
import { JobPostingWorkspace } from "./JobPostingWorkspace";
import { ResumeWorkspace } from "./ResumeWorkspace";

/**
 * ModularWorkbench - Main workbench component with split-pane layout
 * 
 * Layout:
 * - When job posting is active or in review mode: Split view (JD panel + Job posting workspace)
 * - When editing master resume: Single pane (Resume workspace only)
 */
export function ModularWorkbench() {
  const viewMode = useAppStore((state) => state.viewMode);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const diffData = useAppStore((state) => state.diffData);
  
  // Show split layout when:
  // 1. Viewing/editing a job posting, OR
  // 2. In diff review mode
  const showSplitLayout = viewMode === "jobPosting" || diffData.isReviewing;
  
  if (showSplitLayout) {
    return (
      <ResizablePane
        left={<JobDescriptionPanel />}
        right={<JobPostingWorkspace />}
        defaultWidth={40}
        minWidth={25}
        maxWidth={60}
        storageKey="jd-panel-width"
        collapsible={true}
        defaultCollapsed={false}
        className="h-full"
      />
    );
  }
  
  // Single pane layout for master resume editing
  return (
    <div className="h-full">
      <ResumeWorkspace />
    </div>
  );
}

