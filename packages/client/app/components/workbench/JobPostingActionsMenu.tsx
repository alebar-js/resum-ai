import { Loader2, Sparkles, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAppStore } from "~/lib/store";
import { useRefactorData } from "~/lib/queries";
import { useJobPostingData } from "~/lib/queries";

/**
 * JobPostingActionsMenu - Action menu for job posting workspace
 * 
 * Displays available actions for working with a job posting:
 * - Adapt your resume (functional)
 * - Analyze Skill Gaps (placeholder)
 * - Job Description Coverage Score (placeholder)
 * - Mark as Applied (placeholder)
 */
export function JobPostingActionsMenu() {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const startDiffReviewData = useAppStore((state) => state.startDiffReviewData);
  const { data: jobPostingData } = useJobPostingData(activeJobPostingId);
  const refactorMutation = useRefactorData();

  const handleAdaptResume = async () => {
    if (!jobPostingData?.jobDescription?.trim()) {
      // TODO: Show error message
      return;
    }

    try {
      const result = await refactorMutation.mutateAsync({
        jobDescription: jobPostingData.jobDescription,
      });
      startDiffReviewData(result.original, result.refactored);
    } catch (error) {
      console.error("Adapt failed:", error);
      // TODO: Show error message
    }
  };

  const handleAnalyzeSkillGaps = () => {
    // TODO: Implement skill gap analysis
    console.log("Analyze Skill Gaps - Coming soon");
  };

  const handleCoverageScore = () => {
    // TODO: Implement coverage score
    console.log("Job Description Coverage Score - Coming soon");
  };

  const handleMarkAsApplied = () => {
    // TODO: Implement mark as applied
    console.log("Mark as Applied - Coming soon");
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Job Posting Actions
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose an action to work with this job posting
          </p>
        </div>

        <Button
          onClick={handleAdaptResume}
          disabled={!jobPostingData?.jobDescription?.trim() || refactorMutation.isPending}
          size="lg"
          className="w-full justify-start gap-3 h-12"
        >
          {refactorMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adapting...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Adapt Your Resume
            </>
          )}
        </Button>

        <Button
          onClick={handleAnalyzeSkillGaps}
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 h-12"
          disabled
        >
          <TrendingUp className="w-5 h-5" />
          Analyze Skill Gaps
          <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </Button>

        <Button
          onClick={handleCoverageScore}
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 h-12"
          disabled
        >
          <BarChart3 className="w-5 h-5" />
          Job Description Coverage Score
          <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </Button>

        <Button
          onClick={handleMarkAsApplied}
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 h-12"
          disabled
        >
          <CheckCircle2 className="w-5 h-5" />
          Mark as Applied
          <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </Button>

        {refactorMutation.isError && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium mb-1">
              Failed to adapt resume
            </p>
            <p className="text-xs text-destructive/80">
              {refactorMutation.error instanceof Error
                ? refactorMutation.error.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

