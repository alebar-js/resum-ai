import { useAppStore } from "~/lib/store";
import { useJobPostingData } from "~/lib/queries";
import { JobPostingActionsMenu } from "./JobPostingActionsMenu";
import { ResumeWorkspace } from "./ResumeWorkspace";
import { Loader2 } from "lucide-react";

/**
 * JobPostingWorkspace - Parent container for job posting workspace views
 * 
 * Determines which view to render based on state:
 * - JobPostingActionsMenu: When no resume data exists
 * - ResumeWorkspace: When resume data exists or in diff review
 * - Future: SkillGapsAnalysis, CoverageScore, etc.
 */
export function JobPostingWorkspace() {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const diffData = useAppStore((state) => state.diffData);
  const { data: jobPostingData, isLoading } = useJobPostingData(activeJobPostingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show actions menu when:
  // - Not in diff review mode, AND
  // - No resume data exists for this job posting
  const showActionsMenu = !diffData.isReviewing && !jobPostingData?.data;

  if (showActionsMenu) {
    return <JobPostingActionsMenu />;
  }

  // Otherwise show the resume workspace
  return <ResumeWorkspace />;
}

