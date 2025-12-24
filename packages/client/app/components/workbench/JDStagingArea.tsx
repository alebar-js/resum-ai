import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { useAppStore } from "~/lib/store";
import { useRefactor } from "~/lib/queries";

export function JDStagingArea() {
  const [isOpen, setIsOpen] = useState(true);
  const jobDescription = useAppStore((state) => state.jobDescription);
  const setJobDescription = useAppStore((state) => state.setJobDescription);
  const startDiffReview = useAppStore((state) => state.startDiffReview);
  
  const refactorMutation = useRefactor();

  const handleAdapt = async () => {
    if (!jobDescription.trim()) return;

    try {
      const result = await refactorMutation.mutateAsync({ jobDescription });
      startDiffReview(result.original, result.refactored);
      setIsOpen(false);
    } catch (error) {
      console.error("Adapt failed:", error);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Job Description
          </button>
        </CollapsibleTrigger>
        <Button
          onClick={handleAdapt}
          disabled={!jobDescription.trim() || refactorMutation.isPending}
          size="sm"
        >
          {refactorMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adapting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Adapt Resume
            </>
          )}
        </Button>
      </div>
      
      <CollapsibleContent>
        <div className="px-4 pb-4">
          <Textarea
            placeholder="Paste the job description here (not your resume)...\n\nThis is where you paste the job posting details. Once you click 'Adapt Resume', AI will tailor your main resume to match this job description."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="min-h-[120px] bg-input resize-none"
          />
          {/* Error state for mutation */}
          {refactorMutation.isError && (
            <div className="mt-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-1">Failed to adapt resume</p>
              <p className="text-xs text-destructive/80">
                {refactorMutation.error instanceof Error
                  ? refactorMutation.error.message
                  : "An unexpected error occurred. Please try again."}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

