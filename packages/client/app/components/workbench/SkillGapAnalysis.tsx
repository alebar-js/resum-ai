import { Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useAppStore } from "~/lib/store";
import { useRefactorData, useJobPostingData } from "~/lib/queries";
import type { SkillGapAnalysisResponse, SkillGapCategory, SkillGapItem } from "@app/shared";
import { cn } from "~/lib/utils";

interface SkillGapAnalysisProps {
  data: SkillGapAnalysisResponse;
}

const categoryLabels: Record<SkillGapCategory, string> = {
  hard_skills: "Hard Skills",
  domain_knowledge: "Domain Knowledge",
  seniority: "Seniority",
};

interface SkillGapSectionProps {
  title: string;
  items: SkillGapItem[];
  status: "matched" | "missing" | "partial";
  icon: typeof CheckCircle2;
}

function SkillGapSection({
  title,
  items,
  status,
  icon: Icon,
}: SkillGapSectionProps) {
  if (items.length === 0) return null;

  const bgColors = {
    matched: "bg-green-500/10 border-green-500/20",
    missing: "bg-red-500/10 border-red-500/20",
    partial: "bg-amber-500/10 border-amber-500/20",
  };

  const textColors = {
    matched: "text-green-400",
    missing: "text-red-400",
    partial: "text-amber-400",
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5", textColors[status])} />
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline" className="ml-auto">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg p-3 border",
              bgColors[status]
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{item.skill}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[item.category]}
                  </Badge>
                </div>
                {item.evidence && (
                  <p className="text-sm text-muted-foreground/80 mt-1 italic">
                    "{item.evidence}"
                  </p>
                )}
                {item.recommendation && (
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 {item.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SkillGapAnalysis({ data }: SkillGapAnalysisProps) {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const startDiffReviewData = useAppStore((state) => state.startDiffReviewData);
  const jobDescription = useAppStore((state) => state.jobDescription);
  const setJobPostingView = useAppStore((state) => state.setJobPostingView);
  const { data: jobPostingData } = useJobPostingData(activeJobPostingId ?? "");
  const refactorMutation = useRefactorData();
  
  // Use job description from state or job posting data
  const effectiveJobDescription = jobDescription || jobPostingData?.jobDescription || "";

  const handleRefactorToFixGaps = async () => {
    if (!effectiveJobDescription.trim()) {
      // TODO: Show error message
      return;
    }

    try {
      const result = await refactorMutation.mutateAsync({
        jobDescription: effectiveJobDescription,
      });
      startDiffReviewData(result.original, result.refactored);
      setJobPostingView("resume");
    } catch (error) {
      console.error("Refactor failed:", error);
      // TODO: Show error message
    }
  };

  const { summary, matched, missing, partial } = data;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold mb-1">Skill Gap Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Comparison of your resume against the job description
        </p>
      </div>

      {/* Summary Card */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Match Score</p>
            <p className="text-3xl font-bold text-foreground">
              {summary.matchPercentage.toFixed(1)}%
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-green-400 font-semibold">{summary.matchedCount}</p>
              <p className="text-muted-foreground text-xs">Matched</p>
            </div>
            <div className="text-center">
              <p className="text-amber-400 font-semibold">{summary.partialCount}</p>
              <p className="text-muted-foreground text-xs">Partial</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-semibold">{summary.missingCount}</p>
              <p className="text-muted-foreground text-xs">Missing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <SkillGapSection
          title="Matched Skills"
          items={matched}
          status="matched"
          icon={CheckCircle2}
        />

        <SkillGapSection
          title="Partial Matches"
          items={partial}
          status="partial"
          icon={AlertCircle}
        />

        <SkillGapSection
          title="Missing Skills"
          items={missing}
          status="missing"
          icon={XCircle}
        />
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card/50">
        <Button
          onClick={handleRefactorToFixGaps}
          disabled={!effectiveJobDescription.trim() || refactorMutation.isPending}
          className="w-full gap-2"
          size="lg"
        >
          {refactorMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Refactoring...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Refactor to Fix Gaps
            </>
          )}
        </Button>
        {refactorMutation.isError && (
          <div className="mt-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium mb-1">
              Failed to refactor resume
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

