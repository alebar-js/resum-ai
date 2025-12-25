import { Loader2, Sparkles, TrendingUp, CheckCircle2, FileText, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAppStore } from "~/lib/store";
import { useRefactorData, useAnalyzeSkillGaps, useMasterResumeData } from "~/lib/queries";
import { useJobPostingData } from "~/lib/queries";

/**
 * JobPostingActionsMenu - Action menu for job posting workspace
 * 
 * Displays available actions for working with a job posting:
 * - Adapt your resume (functional)
 * - Analyze Skill Gaps (placeholder)
 * - Export Resume (PDF/DOCX)
 * - Mark as Applied (placeholder)
 */
export function JobPostingActionsMenu() {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const startDiffReviewData = useAppStore((state) => state.startDiffReviewData);
  const setJobPostingView = useAppStore((state) => state.setJobPostingView);
  const setJobDescription = useAppStore((state) => state.setJobDescription);
  const setSkillGapData = useAppStore((state) => state.setSkillGapData);
  const { data: jobPostingData } = useJobPostingData(activeJobPostingId ?? "");
  const { data: masterResumeData } = useMasterResumeData();
  const refactorMutation = useRefactorData();
  const skillGapMutation = useAnalyzeSkillGaps();

  const handleAdaptResume = async () => {
    // If resume already exists, just navigate to it
    if (jobPostingData?.data) {
      setJobPostingView("resume");
      return;
    }

    // Otherwise, create a new personalized resume
    if (!jobPostingData?.jobDescription?.trim()) {
      // TODO: Show error message
      return;
    }

    try {
      // Store job description in state for refactor
      setJobDescription(jobPostingData.jobDescription);
      const result = await refactorMutation.mutateAsync({
        jobDescription: jobPostingData.jobDescription,
      });
      startDiffReviewData(result.original, result.refactored);
      setJobPostingView("resume");
    } catch (error) {
      console.error("Adapt failed:", error);
      // TODO: Show error message
    }
  };

  const hasExistingResume = !!jobPostingData?.data;

  const handleAnalyzeSkillGaps = async () => {
    if (!jobPostingData?.jobDescription?.trim()) {
      // TODO: Show error message
      return;
    }

    // Use personalized resume if it exists, otherwise fall back to master resume
    const resumeToAnalyze = jobPostingData?.data || masterResumeData?.data;

    if (!resumeToAnalyze) {
      // TODO: Show error message - no resume available
      return;
    }

    try {
      // Store job description in state
      setJobDescription(jobPostingData.jobDescription);
      const result = await skillGapMutation.mutateAsync({
        jobDescription: jobPostingData.jobDescription,
        resume: resumeToAnalyze,
      });
      setSkillGapData(result);
      setJobPostingView("skillGaps");
    } catch (error) {
      console.error("Skill gap analysis failed:", error);
      // TODO: Show error message
    }
  };

  const handleExportResume = () => {
    if (hasExistingResume || masterResumeData?.data) {
      setJobPostingView("export");
    }
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
          disabled={
            hasExistingResume 
              ? false 
              : (!jobPostingData?.jobDescription?.trim() || refactorMutation.isPending)
          }
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
              {hasExistingResume ? (
                <>
                  <FileText className="w-5 h-5" />
                  View Personalized Resume
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Adapt Your Resume
                </>
              )}
            </>
          )}
        </Button>

        <Button
          onClick={handleAnalyzeSkillGaps}
          disabled={
            !jobPostingData?.jobDescription?.trim() || 
            (!jobPostingData?.data && !masterResumeData?.data) || 
            skillGapMutation.isPending
          }
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 h-12"
        >
          {skillGapMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              Analyze Skill Gaps
            </>
          )}
        </Button>

        <Button
          onClick={handleExportResume}
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 h-12"
          disabled={!hasExistingResume && !masterResumeData?.data}
        >
          <Download className="w-5 h-5" />
          Export Resume
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

        {(refactorMutation.isError || skillGapMutation.isError) && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium mb-1">
              {refactorMutation.isError ? "Failed to adapt resume" : "Failed to analyze skill gaps"}
            </p>
            <p className="text-xs text-destructive/80">
              {(refactorMutation.error || skillGapMutation.error) instanceof Error
                ? (refactorMutation.error || skillGapMutation.error)?.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

