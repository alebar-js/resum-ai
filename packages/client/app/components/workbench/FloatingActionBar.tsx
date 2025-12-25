import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Check, RotateCcw, RefreshCw, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAppStore } from "~/lib/store";
import { useRefactorData, useCreateJobPostingData, useUpdateJobPostingData } from "~/lib/queries";

export function FloatingActionBar() {
  const navigate = useNavigate();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [forkTitle, setForkTitle] = useState("");
  
  const diffData = useAppStore((state) => state.diffData);
  const keepChangesData = useAppStore((state) => state.keepChangesData);
  const undoChangesData = useAppStore((state) => state.undoChangesData);
  const jobDescription = useAppStore((state) => state.jobDescription);
  const startDiffReviewData = useAppStore((state) => state.startDiffReviewData);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);

  const refactorMutation = useRefactorData();
  const createJobPostingMutation = useCreateJobPostingData();
  const updateJobPostingMutation = useUpdateJobPostingData();

  const handleKeep = useCallback(() => {
    if (!diffData.resolved) return;
    
    // If we have an active job posting, update it directly
    if (activeJobPostingId) {
      updateJobPostingMutation.mutate({
        id: activeJobPostingId,
        data: {
          data: diffData.resolved,
          status: "READY",
        },
      });
      keepChangesData();
    } else {
      // Show save dialog to create a new job posting
      setShowSaveDialog(true);
    }
  }, [activeJobPostingId, diffData.resolved, keepChangesData, updateJobPostingMutation]);

  const handleSaveFork = useCallback(async () => {
    if (!forkTitle.trim() || !diffData.resolved) return;

    try {
      const newJobPosting = await createJobPostingMutation.mutateAsync({
        title: forkTitle,
        jobDescription: jobDescription,
        data: diffData.resolved,
      });
      
      navigate(`/job-posting/${newJobPosting.id}`);
      keepChangesData();
      setShowSaveDialog(false);
      setForkTitle("");
    } catch (error) {
      console.error("Failed to save job posting:", error);
    }
  }, [forkTitle, jobDescription, diffData.resolved, createJobPostingMutation, navigate, keepChangesData]);

  const handleUndo = useCallback(() => {
    undoChangesData();
    setShowSaveDialog(false);
    setForkTitle("");
  }, [undoChangesData]);

  const handleRegenerate = useCallback(async () => {
    if (!jobDescription.trim()) return;
    
    try {
      const result = await refactorMutation.mutateAsync({ jobDescription });
      startDiffReviewData(result.original, result.refactored);
    } catch (error) {
      console.error("Regenerate failed:", error);
    }
  }, [jobDescription, refactorMutation, startDiffReviewData]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!diffData.isReviewing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input
      if (e.target instanceof HTMLInputElement) return;
      
      // Escape to undo
      if (e.key === "Escape") {
        e.preventDefault();
        handleUndo();
      }
      // Cmd/Ctrl + Enter to keep
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleKeep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diffData.isReviewing, handleKeep, handleUndo]);

  if (!diffData.isReviewing) return null;

  // Show save dialog
  if (showSaveDialog) {
    return (
      <div className="p-4 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Job posting name (e.g., Meta - Sr. Engineer)"
              value={forkTitle}
              onChange={(e) => setForkTitle(e.target.value)}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && forkTitle.trim()) {
                  handleSaveFork();
                }
                if (e.key === "Escape") {
                  setShowSaveDialog(false);
                }
              }}
            />
            <Button
              onClick={handleSaveFork}
              disabled={!forkTitle.trim() || createJobPostingMutation.isPending}
              className="gap-2"
            >
              {createJobPostingMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Job Posting
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
          </div>
          {/* Error state for create job posting mutation */}
          {createJobPostingMutation.isError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-1">Failed to save job posting</p>
              <p className="text-xs text-destructive/80">
                {createJobPostingMutation.error instanceof Error
                  ? createJobPostingMutation.error.message
                  : "An unexpected error occurred. Please try again."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={handleUndo} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Undo
            <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd>
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            disabled={refactorMutation.isPending}
            className="gap-2"
          >
            {refactorMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleKeep} 
            disabled={updateJobPostingMutation.isPending}
            className="gap-2"
          >
            {updateJobPostingMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Keep
                <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">⌘↵</kbd>
              </>
            )}
          </Button>
        </div>
        
        {/* Error states for mutations */}
        {(refactorMutation.isError || updateJobPostingMutation.isError) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium mb-1">
              {refactorMutation.isError ? "Failed to regenerate" : "Failed to save changes"}
            </p>
            <p className="text-xs text-destructive/80">
              {(refactorMutation.error || updateJobPostingMutation.error) instanceof Error
                ? (refactorMutation.error || updateJobPostingMutation.error)?.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
